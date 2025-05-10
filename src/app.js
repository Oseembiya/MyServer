const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectToDatabase } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const lessonsRouter = require("./routes/lessons");
const ordersRouter = require("./routes/orders");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Lesson Management API",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      lessons: "/lessons",
      orders: "/order",
      health: "/health",
    },
  });
});

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
const imagePath = path.resolve(__dirname, "../images");
app.use("/images", (req, res, next) => {
  const fileRequested = path.join(imagePath, req.path);
  fs.access(fileRequested, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).json({ error: "Image not found" });
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(fileRequested);
    }
  });
});

// Routes
app.use("/lessons", lessonsRouter);
app.use("/order", ordersRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
