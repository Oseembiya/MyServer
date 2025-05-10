const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const lessonsRouter = require('./routes/lessons');
const ordersRouter = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Database middleware
app.use(async (req, res, next) => {
    try {
        req.db = await connectToDatabase();
        next();
    } catch (error) {
        next(error);
    }
});

// Static file serving for lesson images with CORS headers
const imagePath = path.resolve(__dirname, '../images');
app.use('/images', (req, res, next) => {
    const fileRequested = path.join(imagePath, req.path);
    fs.access(fileRequested, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).json({ error: "Image not found" });
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.sendFile(fileRequested);
        }
    });
});

// Routes
app.use('/lessons', lessonsRouter);
app.use('/order', ordersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 