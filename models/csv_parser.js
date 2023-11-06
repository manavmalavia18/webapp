require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const dbconnect = require('../connection.js');
const User = require('../models/user.js').User;
const { createLogger, transports, format } = require('winston');

// Create a logger with a File transport
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: '/var/log' }), // Log to a file (customize the filename as needed)
  ],
});

const path = process.env.DEFAULTUSERPATH;

async function loadUsersFromCSV() {
  await dbconnect.dbconnect();
  try {
    if (path === '') {
      logger.info('Default users file not found');
      return;
    } else {
      logger.info('Reading default users from file:', path);
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
        logger.info('User loading from CSV completed');
      });
  } catch (error) {
    logger.error('Error loading users from CSV:', error);
  }
}

loadUsersFromCSV();

// Call the function to load users from CSV at startup
module.exports = { loadUsersFromCSV: loadUsersFromCSV };
