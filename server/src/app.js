const express = require('express');
const cors = require('cors');
const sensorRoutes = require('./routes/sensorRouter');
const deviceRoutes = require('./routes/deviceRouter');

const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);



module.exports = app;