const express = require("express");
const bodyParser = require("body-parser");
const { request } = require("express");
const { assignment } = require("../models/assignments.js");
const { ValidationError } = require("sequelize");
const User = require("../models/user").User;
const Assignment = require("../models/assignments.js").assignment;
const Submission=require('../models/submission.js').Submission
const winston = require("winston");
const AWS = require('aws-sdk');

// statsd
const statsd=require("node-statsd")
const stats= new statsd({host:"localhost",port:8125})

AWS.config.update({
  region: process.env.AWS_REGION
});

//sns
const sns = new AWS.SNS();


function notifySubmission(url, userEmail, firstName, lastName, assignmentName, submissionTime) {
  const message = {
      submission_url: url,
      userEmail: userEmail,
      firstName: firstName,
      lastName: lastName,
      assignmentName: assignmentName,
      submissionTime: submissionTime
  };
  console.log(message)

  const params = {
      TopicArn: process.env.TOPICARN, 
      Message: JSON.stringify(message)
  };

  sns.publish(params, (err, data) => {
      if (err) console.error('Error publishing to SNS:', err);
      else console.log(`Notification sent, Message ID: ${data.MessageId}`);
  });
}




 //logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, lineNumber, source, errorType }) => {
    return JSON.stringify({
      timestamp,   
      level,         
      message,       
      lineNumber,
      source,
      errorType,
    });
  })
);


const errorLogger = winston.createLogger({
  level: "error",
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "/var/log/webapp.log" }),
  ],
});

function logError(errorType, errorMessage) {
  const error = new Error();
  const lineNumber = error.stack.split("\n")[2].match(/:(\d+):\d+\)$/);
  const logLineNumber = lineNumber ? lineNumber[1] : "N/A";
  errorLogger.error(errorMessage, { errorType, lineNumber: logLineNumber, source: __filename });
}


const createAssignment = async (req, res) => {
  stats.increment(`api.assignments.create.calls`)
  const userId = req.User.id;
  const userRole = req.User.role;
  if (userRole !== 0) { // Check if the user is not a student
    logError("ClientError", "students cannot create assignments");
    return res.status(403).send('students cannot create assignments');
  }
  const { name, points, num_of_attempts, deadline } = req.body;
  try {
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (contentLength === 0) {
      logError("ClientError", "Content-Length is 0");
      return res.status(400).send();
    }
    if (
      typeof name !== "string" ||
      typeof points !== "number" ||
      typeof num_of_attempts !== "number" ||
      typeof deadline !== "string" ||
      !name ||
      !deadline
    ) {
      logError("ValidationError", "Invalid request parameters");
      return res.status(400).send();
    }
    if (!Number.isInteger(points) || !Number.isInteger(num_of_attempts)) {
      logError("ValidationError", "Invalid integer values");
      return res.status(400).send();
    }
    if (points < 1 || points > 100) {
      logError("ValidationError", "Points should be between 1 and 100");
      return res.status(400).send();
    }
    if (num_of_attempts < 1 || num_of_attempts > 100) {
      logError("ValidationError", "Number of attempts should be between 1 and 100");
      return res.status(400).send();
    }
    if (points < 0) {
      logError("ValidationError", "Points cannot be negative");
      return res.status(400).send();
    }
    if (num_of_attempts < 0) {
      logError("ValidationError", "Number of attempts cannot be negative");
      return res.status(400).send();
    }
    const assignment = await Assignment.create({
      name,
      points,
      num_of_attempts,
      deadline,
      userId,
    });
    const resAssignment = {
      id: assignment.id,
      name: assignment.name,
      points: assignment.points,
      num_of_attempts: assignment.num_of_attempts,
      deadline: assignment.deadline,
      assignment_created: assignment.assignment_created,
      assignment_updated: assignment.assignment_updated,
    };
    res.status(201).send(resAssignment);
  } catch (error) {
    if (error instanceof ValidationError) {
      logError("ValidationError", "Validation Error");
      res.status(400).send();
    } else {
      logError("ServerError", error.message);
      res.status(403).send();
    }
  }
};

const getAllAssignments = async (req, res) => {
  stats.increment(`api.assignments.get.calls`)
  if (req.User.role !== 0) {
    logError("ClientError", "Only professors can view all assignments");
    return res.status(403).send('Only professors can view all assignments');
  }
  try {
    const assignments = await Assignment.findAll({
      attributes: {
        exclude: ["userId"],
      },
    });
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (Object.keys(req.query).length > 0 || contentLength > 0) {
      logError("ClientError", "Invalid query or content length");
      return res.status(400).send();
    } else {
      res.status(200).send(assignments);
    }
  } catch (error) {
    logError("ServerError", error.message);
    res.status(400).send();
  }
};

const getAssignmentById = async (req, res) => {
  stats.increment(`api.assignments.getid.calls`)
  if (req.User.role !== 0) {
    logError("ClientError", "Only professors can view all assignments");
    return res.status(403).send('Only professors can view all assignments');
  }
  const contentLength = parseInt(req.get("Content-Length") || "0", 10);
  if (Object.keys(req.query).length > 0 || contentLength > 0) {
    logError("ClientError", "Invalid query or content length");
    return res.status(400).send();
  }
  const { id } = req.params;
  try {
    const assignment = await Assignment.findByPk(id, {
      attributes: {
        exclude: ["userId"],
      },
    });
    if (!assignment) {
      logError("ClientError", "Assignment not found");
      return res.status(404).send();
    } else {
      res.status(200).send(assignment);
    }
  } catch (error) {
    logError("ServerError", error.message);
    res.status(400).send();
  }
};

const updateAssignment = async (req, res) => {
  stats.increment(`api.assignments.update.calls`)
  const userRole = req.User.role;
  if (userRole !== 0) { // Check if the user is not a student
    logError("ClientError", "students cannot update assignments");
    return res.status(403).send('students cannot update assignments');
  }
  const { name, points, num_of_attempts, deadline } = req.body;
  const { id } = req.params;
  const userId = req.User.id;
  try {
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (contentLength === 0) {
      logError("ClientError", "Content-Length is 0");
      return res.status(400).send();
    }
    if (
      typeof name !== "string" ||
      typeof points !== "number" ||
      typeof num_of_attempts !== "number" ||
      typeof deadline !== "string" ||
      !name ||
      !deadline
    ) {
      logError("ValidationError", "Invalid request parameters");
      return res.status(400).send();
    }
    if (!Number.isInteger(points) || !Number.isInteger(num_of_attempts)) {
      logError("ValidationError", "Invalid integer values");
      return res.status(400).send();
    }
    if (points < 1 || points > 100) {
      logError("ValidationError", "Points should be between 1 and 100");
      return res.status(400).send();
    }
    if (num_of_attempts < 1 || num_of_attempts > 100) {
      logError("ValidationError", "Number of attempts should be between 1 and 100");
      return res.status(400).send();
    }
    if (points < 0) {
      logError("ValidationError", "Points cannot be negative");
      return res.status(400).send();
    }
    if (num_of_attempts < 0) {
      logError("ValidationError", "Number of attempts cannot be negative");
      return res.status(400).send();
    }
    if (
      Object.keys(req.body).every((key) =>
        ["name", "points", "num_of_attempts", "deadline"].includes(key)
      ) === false
    ) {
      logError("ValidationError", "Invalid update fields");
      return res.status(400).send();
    }
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      logError("ClientError", "Assignment not found");
      return res.status(404).send();
    } else {
      if (userId !== assignment.userId) {
        logError("ClientError", "Permission denied");
        return res.status(403).send();
      }
      assignment.name = name;
      assignment.points = points;
      assignment.num_of_attempts = num_of_attempts;
      assignment.deadline = deadline;
      await assignment.save();
      res.status(204).send(assignment);
    }
  } catch (e) {
    logError("ServerError", e.message);
    res.status(403).send();
  }
};

const deleteAssignment = async (req, res) => {
  stats.increment(`api.assignments.delete.calls`)
  const userRole = req.User.role;
  if (userRole !== 0) { // Check if the user is not a student
    logError("ClientError", "students cannot delete assignments");
    return res.status(403).send('students cannot delete assignments');
  }
  const contentLength = parseInt(req.get("Content-Length") || "0", 10);
  if (Object.keys(req.query).length > 0 || contentLength > 0) {
    logError("ClientError", "Invalid query or content length");
    return res.status(400).send();
  }
  const { id } = req.params;
  const userId = req.User.id;
  try {
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      logError("ClientError", "Assignment not found");
      return res.status(404).send();
    } else {
      if (userId !== assignment.userId) {
        logError("ClientError", "Permission denied");
        return res.status(403).send();
      }
      await assignment.destroy();
      res.status(204).send();
    }
  } catch (e) {
    logError("ServerError", e.message);
    res.status(403).send();
  }
};

const submitAssignment = async (req, res) => {
  stats.increment(`api.assignments.submit.calls`);
  const { submission_url } = req.body;
  const { id } = req.params; 
  const userId = req.User.id; 
  const userEmail = req.User.email;

  try {
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (contentLength === 0) {
      logError("ClientError", "Content-Length is 0");
      return res.status(400).send();
    }
    const assignmentRecord = await Assignment.findByPk(id);
    const userRecord = await User.findByPk(userId);

    if (!assignmentRecord) {
      return res.status(404).send('Assignment not found');
    }

    if (!userRecord) {
      return res.status(404).send('User not found');
    }

    const firstName = userRecord.first_name;
    const lastName = userRecord.last_name;
    const assignmentName = assignmentRecord.name;

    if (userId === assignmentRecord.userId) {
      logError("ClientError", "Assignment creator cannot submit to their own assignment");
      return res.status(403).send('Assignment creator cannot submit to their own assignment');
    }

    const currentDateTime = new Date();
    const assignmentDeadline = new Date(assignmentRecord.deadline);
    if (currentDateTime > assignmentDeadline) {
      return res.status(403).send('Assignment deadline has passed');
    }

    const submissionCount = await Submission.count({
      where: { UserId: userId, AssignmentId: id }
    });

    if (submissionCount >= assignmentRecord.num_of_attempts) {
      return res.status(403).send('Maximum submission attempts exceeded');
    }

    const submission = await Submission.create({
      UserId: userId,
      AssignmentId: id,
      submission_url: submission_url
    });

    const submissionTime = submission.createdAt.toISOString();

    try {
      await notifySubmission(submission_url, userEmail, firstName, lastName, assignmentName, submissionTime);
      console.log('SNS notification sent');
    } catch (snsError) {
      console.error('Error sending SNS notification:', snsError);
    }

    const submissionResponse = {
      id: submission.id,
      assignment_id: id,
      submission_url: submission_url, 
      submission_date: submission.createdAt,
      submission_updated: submission.updatedAt,
    };

    res.status(201).send(submissionResponse);

  } catch (error) {
    console.log(error);
    res.status(400).send('General error');
  }
};



module.exports = {
  createAssignment: createAssignment,
  getAllAssignments: getAllAssignments,
  getAssignmentById: getAssignmentById,
  updateAssignment: updateAssignment,
  deleteAssignment: deleteAssignment,
  submitAssignment:submitAssignment,
  stats:stats,
};
