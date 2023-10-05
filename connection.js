const Sequelize = require("sequelize");
const mariadb = require("mariadb");
require("dotenv").config();

// const mysql=require('mysql2/promise')

const sequelize = new Sequelize(process.env.DB_NAME,process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    logging: false,
    dialect: "mariadb",
});

const pool =mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})
async function dbconnect() {
    await pool.getConnection().then((connection) =>{
        connection.query(`CREATE DATABASE IF NOT EXISTS\`${process.env.DB_NAME}\`;`)
    });
//     await mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD
//   }).then((connection) => {
//     connection.query(`CREATE DATABASE IF NOT EXISTS\`${process.env.DATABASE_NAME}\`;`)
//   })
   
    const User = require('./models/user.js')

    const Assignment = require('./models/assignments.js')
    
    const fkeyid =require("./foreignkey.js")

    await sequelize.sync();
    return sequelize.authenticate().then(async() => {
        console.log("database connected")
        return true;
        })
        .catch((error) => {
            console.log("database error")
            return false;
        });


};
 
dbconnect();

module.exports = { 
    sequelize:sequelize,
    conn:dbconnect,

}