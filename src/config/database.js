const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// Production-ready MongoDB configuration
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
  maxPoolSize: 50,
  minPoolSize: 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
});

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return client.db(process.env.MONGODB_DB_NAME || "Databas");
  }

  try {
    await client.connect();
    isConnected = true;
    console.log("MongoDB connected successfully");

    const db = client.db(process.env.MONGODB_DB_NAME || "Databas");

    // Create text index on 'subject' and 'location'
    const lessons = db.collection("lessons");
    await lessons.createIndex({
      subject: "text",
      location: "text",
    });

    // Handle application shutdown
    process.on("SIGINT", async () => {
      try {
        await client.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error during MongoDB disconnection:", err);
        process.exit(1);
      }
    });

    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    // Don't exit process, let the application handle the error
    throw err;
  }
}

module.exports = {
  client,
  connectToDatabase,
};
