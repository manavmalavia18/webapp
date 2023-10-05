require('dotenv').config()
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const dbconnect= require('../connection.js');
const User = require('../models/user.js').User

const path = process.env.DEFAULTUSERPATH
async function loadUsersFromCSV() {
  await dbconnect.dbconnect();
  try {
    if(path ===''){
      console.log('default users file not found')
      return
    }
    else{
      console.log("reading default users from file :",path)
    }
    // Read the CSV file
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', async (row) => {
        // Check if the user already exists based on email
        const existingUser = await User.findOne({ where: { email: row.email } });

        if (!existingUser) {
          // User doesn't exist, create a new one with the hashed password
          await User.create({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            password: row.password,
          });
        } 
      })
      .on('end', () => {
        
      });
  } catch (error) {
    console.error('Error loading users from CSV:', error);
  }
}
loadUsersFromCSV() ;

// Call the function to load users from CSV at startup
module.exports = { loadUsersFromCSV: loadUsersFromCSV };
