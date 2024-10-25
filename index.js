const express = require('express');
const http = require('http');
const path = require('path');

const routes = require('./routes'); // Import the new API route
const { setupSocket } = require('./config/socket'); // Import your socket logic

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Use the messages API route
app.use(routes);

// Initialize Socket.IO with the server
const io = setupSocket(server);

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
