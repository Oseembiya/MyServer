const { MongoClient, ServerApiVersion } = require("mongodb");
const PropertiesReader = require("properties-reader");
const path = require("path");

// Configure connection
const propertiesPath = path.resolve(
  __dirname,
  "../../fetch-server/conf/db.properties"
);
const properties = PropertiesReader(propertiesPath);

const dbPrefix = properties.get("db.prefix");
const dbUser = properties.get("db.user");
const dbPwd = encodeURIComponent(properties.get("db.pwd"));
const dbName = properties.get("db.dbName");
const dbUrl = properties.get("db.dbUrl");
const dbParams = properties.get("db.params");

// Constructing URI
const uri = `${dbPrefix}${dbUser}:${dbPwd}${dbUrl}${dbParams}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully");
    const db = client.db(dbName);

    // Create text index on 'subject' and 'location'
    const lessons = db.collection("lessons");
    await lessons.createIndex({
      subject: "text",
      location: "text",
    });

    return db;
  } catch (err) {
    console.error("MongoDB connection failed", err);
    process.exit(1);
  }
}

module.exports = {
  client,
  connectToDatabase,
};
