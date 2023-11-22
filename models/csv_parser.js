require('dotenv').config();
const fs = require('fs');
const csvParser = require('csv-parser');
const dbconnect = require('../connection.js');
const User = require('../models/user.js').User;
const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: '/var/log/webapp.log' }),
  ],
});

const path = process.env.DEFAULTUSERPATH;

async function loadUsersFromCSV() {
  await dbconnect.dbconnect();
  const rows = [];

  try {
    if (path === '') {
      logger.info('Default users file not found');
      return;
    } else {
      logger.info('Reading default users from file:', path);
    }

    // Read the CSV file
    fs.createReadStream(path)
      .pipe(csvParser())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        logger.info('Processing users from CSV');

        // Process each row sequentially
        for (const row of rows) {
          // Check if the user already exists based on email
          const existingUser = await User.findOne({ where: { email: row.email } });

          if (!existingUser) {
            // User doesn't exist, create a new one
            await User.create({
              first_name: row.first_name,
              last_name: row.last_name,
              email: row.email,
              password: row.password, 
              role: parseInt(row.role)
            });
          }
        }

        logger.info('User loading from CSV completed');
      });
  } catch (error) {
    logger.error('Error loading users from CSV:', error);
  }
}

loadUsersFromCSV();

module.exports = { loadUsersFromCSV };
