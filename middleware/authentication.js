const db = require("../connection.js");
const User = require("../models/user.js").User;
const bcrypt = require("bcrypt");

const basicAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const authParts = authHeader.split(" ");

  if (authParts.length !== 2 || authParts[0].toLowerCase() !== "basic") {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  const authData = Buffer.from(authParts[1], "base64").toString("utf-8");
  const [username, password] = authData.split(":");

  if (!username || !password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  try {
    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    req.User = user;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).send();
  }
};

module.exports = { basicAuthMiddleware: basicAuthMiddleware };
