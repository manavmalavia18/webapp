const express = require("express");
const bodyParser = require("body-parser");
const { request } = require("express");
const { assignment } = require("../models/assignments.js");
const { ValidationError } = require("sequelize");
const User = require("../models/user").User;
const Assignment = require("../models/assignments.js").assignment;
const winston = require("winston");

const statsd=require("node-statsd")
const stats= new statsd({host:"localhost",port:8125})

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



module.exports = {
  createAssignment: createAssignment,
  getAllAssignments: getAllAssignments,
  getAssignmentById: getAssignmentById,
  updateAssignment: updateAssignment,
  deleteAssignment: deleteAssignment,
  stats:stats,
};
