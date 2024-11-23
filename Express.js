const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const PropertiesReader = require("properties-reader");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const app = express(); // create express instance

// Configure connection
let propertiesPath = path.resolve(
  __dirname,
  "fetch-server",
  "conf",
  "db.properties"
);
let properties = PropertiesReader(propertiesPath);
let dbPrefix = properties.get("db.prefix");
let dbUser = properties.get("db.user");
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

// Constructing URI
const uri = `${dbPrefix}${dbUser}:${dbPwd}${dbUrl}${dbParams}`;
let client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

// Console log MongoDB connection status
client
  .connect()
  .then(async () => {
    console.log("MongoDB connected successfully");

    // Create text index on 'subject' and 'location etc'
    try {
      const lessons = db.collection("lessons");
      const indexResult = await lessons.createIndex({
        subject: "text",
        location: "text",
      });
    } catch (indexError) {
      console.error("Error creating index:", indexError);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
    process.exit(1); // Exit the process if the database connection fails
  });

app.set("json spaces", 3);

// Static file for lesson images with CORS headers
const imagePath = path.resolve(__dirname, "images");
app.use("/images", (req, res, next) => {
  const fileRequested = path.join(imagePath, req.path);
  // Check if the file exists
  fs.access(fileRequested, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, return error message
      res.status(404).json({ error: "Image not found" });
    } else {
      // File exists, serve it with CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(fileRequested);
    }
  });
});
// Middleware

app.use(cors()); // Enable CORS
app.use(morgan("combined")); // Use morgan for detailed logging
app.use(express.json()); // Parse JSON bodies

// Routes

app.get("/search", async (req, res) => {
  const searchQuery = req.query.q; // Capture the query parameter

  if (!searchQuery) {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    const lessons = db.collection("lessons");

    // Perform a full-text search (ensure you created the correct text index)
    const results = await lessons
      .find({
        $text: { $search: searchQuery }, // Full-text search using $text
      })
      .toArray();

    // If no results are found, fallback to regex search
    if (results.length === 0) {
      const regexResults = await lessons
        .find({
          $or: [
            { subject: { $regex: searchQuery, $options: "i" } }, // Regex search on subject field
            { location: { $regex: searchQuery, $options: "i" } },
            // Regex search on location field
          ],
        })
        .toArray();

      if (regexResults.length === 0) {
        return res.status(404).json({ error: "No lessons found." });
      }

      return res.json(regexResults); // Return regex-based results if found
    }

    res.json(results); // Return full-text search results
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during the search." });
  }
});

app.get("/lessons", function (req, res, next) {
  db.collection("lessons")
    .find({})
    .toArray()
    .then((classes) => {
      res.json(classes); // Send data as JSON
    })
    .catch((error) => {
      console.error("Error fetching class activities:", error);
      next(error); // Pass error to error-handling middleware
    });
});

app.post("/order", function (req, res, next) {
  const orderData = req.body; // Receive the full orderData with orderInfo and lessonId

  const { orderInfo, lessonId } = orderData;

  // Validate lessonId to be an array
  if (!lessonId.every((id) => ObjectId.isValid(id))) {
    return res
      .status(400)
      .json({ error: "One or more lesson IDs are invalid." });
  }

  // Log the order data for debugging purposes
  console.log("Order received:", orderData);

  // Save the order data into the database
  db.collection("order")
    .insertOne({
      orderInfo, // Save orderInfo separately
      lessonId, // Save lessonId separately
    })
    .then((result) => {
      res.status(201).json({
        message: "Order placed successfully",
        insertedId: result.insertedId,
      });
    })
    .catch((error) => {
      console.error("Error saving order:", error);
      next(error);
    });
});

app.put("/updateLesson/:id", function (req, res, next) {
  const lessonId = req.params.id;

  // Validate the lesson ID format
  if (!ObjectId.isValid(lessonId)) {
    return res.status(400).json({ error: "Invalid lesson ID." });
  }

  const updatedData = req.body;

  // Check if the updated data is provided
  if (!updatedData || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: "No data provided for update." });
  }

  const lessons = db.collection("lessons");

  // Perform the update operation using promises
  lessons
    .updateOne({ _id: new ObjectId(lessonId) }, { $set: updatedData })
    .then((result) => {
      // Check if the lesson was updated successfully
      if (result.modifiedCount > 0) {
        res.json({ message: "Lesson updated successfully" });
      } else {
        res
          .status(404)
          .json({ error: "Lesson not found or no fields changed." });
      }
    })
    .catch((error) => {
      // Pass the error to the next error-handling middleware
      next(error);
    });
});

// Middleware for error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message || "Internal Server Error",
  });
});

// Start the server listening in port 8000
const PORT = process.env.PORT || 8000;
app.listen(PORT, function () {
  console.log(
    `Server is running on https://vueappliaction-env.eba-qkd3evgp.eu-west-2.elasticbeanstalk.com/${PORT}`
  );
});
