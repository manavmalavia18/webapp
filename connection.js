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
        new winston.transports.File({ filename: "/var/log/webapp.log"})
    ]
});

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    logging: false,
    dialect: process.env.DIALECT,
    pool: {
        max: 10, 
        min: 0, 
        idle: 10000, 
        acquire: 30000, 
    },
});

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function dbconnect() {

    await pool.getConnection().then((connection) => {
        connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        connection.release();
        logger.info(`Database "${process.env.DB_NAME}" created or already exists.`);
    });

    const User = require('./models/user');

    const Assignment = require('./models/assignments.js');
    // const fkeyid = require("./foreignkey.js");

    const submission=require('./models/submission.js')

    

    await sequelize.sync();
    logger.info("Database synchronized with models.");
}

dbconnect();

const conn = () => {
    // return sequelize
    //     .authenticate()
    //     .then(() => {
    //         logger.info("Connected to the database.");
    //         return true;
    //     })
        // .catch((error) => {
        //     logger.error("Failed to connect to the database:");
        //     return false;
        // });
    return pool.getConnection().then((connection) => {
        connection.release()
        return true
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
