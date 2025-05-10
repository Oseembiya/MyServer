const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

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
