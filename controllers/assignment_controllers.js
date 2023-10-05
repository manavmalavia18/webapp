const express = require("express");
const bodyParser = require("body-parser");
const { request } = require("express");
const { assignment } = require("../models/assignments.js");
const { ValidationError } = require("sequelize");
const User = require("../models/user").User;
const Assignment = require("../models/assignments.js").assignment;

//  create assignment
const createAssignment = async (req, res) => {
  const userId = req.User.id;
  const { name, points, num_of_attempts, deadline } = req.body;
  try {
    const contentLength = parseInt(req.get("Content-Length") || "0", 10)
    if(contentLength==0){
      res.status(400).send()
    }
    const assignment = await Assignment.create({
      name,
      points,
      num_of_attempts,
      deadline,
      userId,
    });
    res.status(201).send(assignment);
  } catch (error) {
    if(error instanceof ValidationError){

      res.status(403).send()
    }
    console.log(error);
    res.status(403).send();
  }
};

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll()
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (Object.keys(req.query).length > 0 || contentLength > 0) {
      return res.status(400).send();
    }
    else{
      res.status(200).send(assignments)
    
    }
  } catch (error) {
    res.status(403).send();
  }
};

// Get an assignment by ID
const getAssignmentById = async (req, res) => {
  const contentLength = parseInt(req.get("Content-Length") || "0", 10);
  if (Object.keys(req.query).length > 0 || contentLength > 0) {
    return res.status(400).send();
  }
  const { id } = req.params;
  try {
    const assignments = await Assignment.findByPk(id);
    if (assignments == null) {
      res.status(404).send();
    } else {
      res.status(200).send(assignments);
    }
  } catch (error) {
    console.log(error);
    res.status(403).send();
  }
};

// Update an assignment by ID
const updateAssignment = async (req, res) => {
  const { name, points, num_of_attempts, deadline } = req.body;
  const { id } = req.params;
  const userId = req.User.id;
  try {
    const assignment = await Assignment.findByPk(id);
    if (assignment == null) {
      res.status(400).send();
    } else {
      if (userId != assignment.userId) {
        res.status(401).send();
      } else {
        assignment.name = name;
        assignment.points = points;
        assignment.num_of_attempts = num_of_attempts;
        assignment.deadline = deadline;
        await assignment.save();
        res.status(204).send(assignment);
      }
    }
  } catch (e) {
    console.log(e);
    res.status(403).send();
  }
};
//delete assignment
const deleteAssignment = async (req, res) => {
  const contentLength = parseInt(req.get("Content-Length") || "0", 10);
  if (Object.keys(req.query).length > 0 || contentLength > 0) {
    return res.status(400).send();
  }
  const { id } = req.params;
  const userId = req.User.id;
  try {
    const assignment = await Assignment.findByPk(id);
    if (assignment == null) {
      res.status(404).send();
    } else {
      if (userId != assignment.userId) {
        res.status(401).send();
      } else {
        await assignment.destroy();
        res.status(204).send();
      }
    }
  } catch (e) {
    res.status(403).send();
  }
};

module.exports = {
  createAssignment: createAssignment,
  getAllAssignments: getAllAssignments,
  getAssignmentById: getAssignmentById,
  updateAssignment: updateAssignment,
  deleteAssignment: deleteAssignment,
};
