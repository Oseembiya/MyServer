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
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// CORS configuration - Updated for GitHub Pages
const allowedOrigins = [
  "http://localhost:8000", // Local development
  "http://localhost:5173", // Vite dev server
  "https://oseembiya.github.io", // GitHub Pages domain// Replace with your actual GitHub username
];

app.use(
  cors({
    origin: function (origin, callback) {
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
        console.log(`CORS blocked origin: ${origin}`);
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
  res.json({
    message: "Welcome to the ParentPay API",
    version: "1.0.0",
    status: "operational",
    frontend: "https://oseembiya.github.io/Vue/", // Link to your frontend
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
const imagePath = path.resolve(__dirname, "../");
app.use("/", (req, res, next) => {
  if (req.path.startsWith("/images/")) {
    const fileRequested = path.join(imagePath, req.path);
    fs.access(fileRequested, fs.constants.F_OK, (err) => {
      if (err) {
        return next();
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        return res.sendFile(fileRequested);
      }
    });
  } else {
    next();
  }
});

// API Routes
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
    frontend: "https://oseembiya.github.io/Vue/",
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(
    `API Server is running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
  console.log(
    `Frontend should be available at: https://oseembiya.github.io/Vue/`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

module.exports = app;
