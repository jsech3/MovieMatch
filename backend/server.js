const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import route handlers
const movieRoutes = require('./routes/movies');
const roomRoutes = require('./routes/rooms');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MovieMatch API' });
});

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/rooms', roomRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
