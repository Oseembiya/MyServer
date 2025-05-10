const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Get all lessons
router.get("/", async (req, res, next) => {
  try {
    const lessons = await req.db.collection("lessons").find({}).toArray();
    res.json(lessons);
  } catch (error) {
    next(error);
  }
});

// Search lessons
router.get("/search", async (req, res, next) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    return res.status(406).json({ error: "Search query is required." });
  }

  try {
    const lessons = req.db.collection("lessons");
    const results = await lessons
      .find({
        $text: { $search: searchQuery },
      })
      .toArray();

    if (results.length === 0) {
      const regexResults = await lessons
        .find({
          $or: [
            { subject: { $regex: searchQuery, $options: "i" } },
            { location: { $regex: searchQuery, $options: "i" } },
          ],
        })
        .toArray();

      if (regexResults.length === 0) {
        return next(new Error("No lessons found."));
      }
      return res.json(regexResults);
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Update lesson
router.put("/:id", async (req, res, next) => {
  const lessonId = req.params.id;
  const updatedData = req.body;

  if (!ObjectId.isValid(lessonId)) {
    return res.status(408).json({ error: "Invalid lesson ID." });
  }

  if (!updatedData || Object.keys(updatedData).length === 0) {
    return res.status(408).json({ error: "No data provided for update." });
  }

  try {
    const result = await req.db
      .collection("lessons")
      .updateOne({ _id: new ObjectId(lessonId) }, { $set: updatedData });

    if (result.modifiedCount > 0) {
      res.json({ message: "Lesson updated successfully" });
    } else {
      res.status(408).json({ error: "Lesson not found or no fields changed." });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
