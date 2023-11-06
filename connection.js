const Sequelize = require('sequelize');
require('dotenv').config();
const mariadb = require("mariadb");
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info', 
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), 
        new winston.transports.File({ filename: "/var/log"})
    ]
});

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    logging: false,
    dialect: process.env.DIALECT,
});

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function dbconnect() {

    await pool.getConnection().then((connection) => {
        connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        // logger.info(`Database "${process.env.DB_NAME}" created or already exists.`);
    });

    const User = require('./models/user');
    // logger.info("User model imported");

    const Assignment = require('./models/assignments.js');
    // logger.info("Assignment model imported");

    const fkeyid = require("./foreignkey.js");
    // logger.info("Foreign key model imported");

    await sequelize.sync();
    // logger.info("Database synchronized with models.");
}

dbconnect();

const conn = () => {
    return sequelize
        .authenticate()
        .then(() => {
            // logger.info("Connected to the database.");
            return true;
        })
        .catch((error) => {
            logger.error("Failed to connect to the database:");
            return false;
        });
}

module.exports = {
    winston: winston,
    logger: logger,
    sequelize: sequelize,
    dbconnect: dbconnect,
    conn: conn
}
