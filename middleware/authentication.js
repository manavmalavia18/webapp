const db = require("../connection.js");
const User = require("../models/user.js").User;
const bcrypt = require("bcrypt");
const path = require("path");
const winston = require("winston");

const logger = winston.createLogger({
  level: 'info', 
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
  ),
  transports: [
      new winston.transports.Console(), 
      new winston.transports.File({ filename: "/var/log/webapp.log"})
  ]
});
const getCurrentFileNameAndLine = () => {
    try {
        throw new Error();
    } catch (e) {
        const stackLines = e.stack.split('\n');
        const lineInfo = stackLines[2] || stackLines[1];
        const parts = lineInfo.match(/\s\((.*):(\d+):(\d+)\)/) || [];
        if (parts.length >= 4) {
            const fileName = path.basename(parts[1]);
            const lineNumber = parts[2];
            return `${fileName}:${lineNumber}`;
        }
        return 'Unknown';
    }
};

const currentFileNameAndLine = getCurrentFileNameAndLine();

const basicAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        logger.error(`${currentFileNameAndLine}: Authorization header missing`);
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const authParts = authHeader.split(' ');

    if (authParts.length !== 2 || authParts[0].toLowerCase() !== 'basic') {
        logger.error(`${currentFileNameAndLine}: Invalid authorization header`);
        return res.status(401).json({ error: 'Invalid authorization header' });
    }

    const authData = Buffer.from(authParts[1], 'base64').toString('utf-8');
    const [username, password] = authData.split(':');

    if (!username || !password) {
        logger.error(`${currentFileNameAndLine}: Invalid credentials`);
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const user = await User.findOne({ where: { email: username } });

        if (!user) {
            logger.error(`${currentFileNameAndLine}: User not found`);
            return res.status(401).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.error(`${currentFileNameAndLine}: Incorrect password`);
            return res.status(401).json({ error: 'Incorrect password' });
        }

        req.User = user;
        next();
    } catch (err) {
        logger.error(`${currentFileNameAndLine}: An error occurred in authentication:`, err);
        return res.status(503).send();
    }
};

module.exports = { basicAuthMiddleware };
