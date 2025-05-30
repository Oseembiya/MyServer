const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// GET all orders (or return endpoint info)
router.get("/", async (req, res, next) => {
  try {
    // Option 1: Return all orders
    const orders = await req.db.collection("order").find({}).toArray();
    res.status(200).json({
      message: "Orders retrieved successfully",
      count: orders.length,
      orders: orders,
    });
  } catch (error) {
    next(error);
  }
});

// Create new order
router.post("/", async (req, res, next) => {
  const orderData = req.body;
  const { orderInfo, lessonId } = orderData;

  // Validate lessonId to be an array
  if (!lessonId.every((id) => ObjectId.isValid(id))) {
    return res
      .status(400)
      .json({ error: "One or more lesson IDs are invalid." });
  }

  try {
    const result = await req.db.collection("order").insertOne({
      orderInfo,
      lessonId,
    });

    res.status(201).json({
      message: "Order placed successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
