require('dotenv').config();
const express = require("express");
const winston = require('winston');
const { format } = require('winston');
const path = require('path');
const db = require("./connection.js");
const csv = require('./models/csv_parser.js');
const basicAuthMiddleware = require("./middleware/authentication");
const assignment_controllers = require("./controllers/assignment_controllers.js");
const axios = require('axios');
const PORT = 3000;

// Custom error formatter
const errorFormatter = format((info) => {
  if (info instanceof Error) {
    const stack = info.stack.split('\n');
    if (stack.length > 1) {
      const trace = stack[1].trim();
      const match = /\(([^:]+):(\d+):\d+\)/.exec(trace) || /at ([^:]+):(\d+):\d+/.exec(trace);
      if (match) {
        info.location = `${path.basename(match[1])}:${match[2]}`;
        info.filename = path.basename(match[1]);
        info.line = match[2];
      }
    }
    return {
      errorcode: info.errorcode,
      message: info.message,
      method: info.method,
      userurl: info.userurl,
      location: info.location,
      filename: info.filename,
      line: info.line,
      timestamp: info.timestamp
    };
  }
  return info;
});
let instanceId = null;
axios.get('http://169.254.169.254/latest/meta-data/instance-id')
    .then(response => {
        instanceId = response.data;
    })
    .catch(error => console.error('Error fetching instance ID:', error));

// Winston Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format((info) => {
      if (instanceId) {
          info.instanceId = instanceId;
      }
      return info;
    })(),
    errorFormatter(),
    format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "/var/log/webapp.log"}),
    new winston.transports.Console()
  ],
});

const app = express();
app.use(express.json());

// Routes and Middleware
app.post('/demo/assignments', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.createAssignment);
app.get('/demo/assignments', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.getAllAssignments);
app.get('/demo/assignments/:id', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.getAssignmentById);
app.put('/demo/assignments/:id', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.updateAssignment);
app.delete('/demo/assignments/:id', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.deleteAssignment);
app.post('/demo/assignments/:id/submission', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.submitAssignment);
app.all('/demo/assignments/:id/submission', (req, res) => {
  res.status(405).send('Method Not Allowed');
});
app.patch('/demo/assignments', (req, res) => {
    res.status(405).send();
    logger.error({
      errorcode: "405",
      message: "Method Not Allowed",
      method: req.method,
      userurl: req.originalUrl,
      location: __filename, 
      filename: path.basename(__filename),
    
    });
});


app.all('/healthz', async (req, res) => {
  assignment_controllers.stats.increment(`healthz.api.calls`)
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method !== "GET") {
        res.status(405).send();
        logger.error({
          errorcode: "405",
          message: "Method Not Allowed",
          method: req.method,
          userurl: req.originalUrl,
          location: __filename, 
          filename: path.basename(__filename),
        
        });
        return;
    }

    const contentLength = parseInt(req.headers['content-length']) || 0;
    if (Object.keys(req.query).length > 0 || contentLength > 0) {
        res.status(400).send();
        logger.error({
          errorcode: "400",
          message: "Bad Request",
          method: req.method,
          userurl: req.originalUrl,
          location: __filename, 
          filename: path.basename(__filename),
        });
        return;
    }

    try {
        const isConnected = await db.conn();
        if (!isConnected) {
            throw new Error('Failed to connect to the database');
        }
        res.status(200).send();
        logger.info('Healthz checkpoint connected succesfully')
    } catch (error) {
        res.status(503).send();
        logger.error({
          errorcode: "503",
          message: error.message,
          method: req.method,
          userurl: req.originalUrl,
          location: __filename, 
          filename: path.basename(__filename),

        });
    }
});

app.all('/*', (req, res) => {
    res.status(404).send();
    logger.error({
      errorcode: "404",
      message: "Link Url Not Found",
      method: req.method,
      userurl: req.originalUrl,
      location: __filename, 
      filename: path.basename(__filename),
    });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app };
