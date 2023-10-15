require('dotenv').config();
const db = require("./connection.js");
const csv = require('./models/csv_parser.js');
const basicAuthMiddleware = require("./middleware/authentication")
const assignment_controllers=require("./controllers/assignment_controllers");
const express = require("express");
const PORT = 3000;

const app = express();
app.use(express.json())

// Create a new assignment
app.post('/v1/assignments', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.createAssignment);

// Get all assignments
app.get('/v1/assignments', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.getAllAssignments);

// Get an assignment by ID
app.get('/v1/assignments/:id', basicAuthMiddleware.basicAuthMiddleware,  assignment_controllers.getAssignmentById);

// Update an assignment by ID
app.put('/v1/assignments/:id', basicAuthMiddleware.basicAuthMiddleware, assignment_controllers.updateAssignment);

// Delete an assignment by ID
app.delete('/v1/assignments/:id', basicAuthMiddleware.basicAuthMiddleware,  assignment_controllers.deleteAssignment);

app.patch('/v1/assignments', (request, response) => {
    response.status(405).send()
    const contentLength = parseInt(req.get("Content-Length") || "0", 10);
    if (contentLength >=0)
    {
    return res.status(400).send();
    }
});

app.all('/healthz', async (request, response) => { 
    response.setHeader('Cache-Control', 'no-cache');
    if(request.method !== "GET") {
        response.status(405).send();
        return;
    }

    const contentLength = parseInt(request.get('Content-Length') || '0', 10);
    if (Object.keys(request.query).length > 0 || contentLength > 0) {
        return response.status(400).send();
    }

    try {
        const connection = await db.dbconnect();
        console.log(connection)
        if (connection == true) {
            response.status(200).send();
        }
        else{
            response.status(503).send();
        }
    } catch (error) {
        console.error(error);
        response.status(500).send(); 
    }
});

app.all('/*', (request, response) => {
    response.setHeader('Cache-Control', 'no-cache');
    response.status(404).send()
});
// server start
app.listen(3000)
module.exports={app}