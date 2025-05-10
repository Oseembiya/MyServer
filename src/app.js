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

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Vue development server
  "http://localhost:8000", // Local development
  "https://*.vercel.app", // Vercel deployments
  "https://*.onrender.com", // Render deployments
  "https://oseembiya.github.io", // GitHub Pages deployment
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.some((allowedOrigin) => {
          if (allowedOrigin.includes("*")) {
            const pattern = allowedOrigin.replace("*", ".*");
            return new RegExp(pattern).test(origin);
          }
          return allowedOrigin === origin;
        })
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root route
app.get("/", (req, res) => {
  console.log("Root route accessed");
  try {
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
  } catch (error) {
    console.error("Error in root route:", error);
    res.status(500).json({ error: "Server error in root route" });
  }
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
      // Set specific CORS headers for images
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
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

// Catch-all route for 404s
app.use("*", (req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Not Found",
    message: `The requested resource at ${req.originalUrl} was not found`,
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
