const express = require("express");
const { Task } = require("../models/task");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Create a new task
router.post("/", auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, owner: req.user._id });
    await task.save();
    res.status(201).json(task);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
});

// Get all tasks
router.get("/", auth, async (req, res) => {
  const match = {},
    sort = {};
  if (req.query.completed) match.completed = req.query.completed === "true";
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] == "desc" ? -1 : 1;
  }
  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.status(200).json(req.user.tasks);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
});

// Get a task by id
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) res.status(404).send();
    res.status(200).json(task);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
});

// Update a task by id
router.patch("/:id", auth, async (req, res) => {
  const validFields = ["description", "completed"];
  const updatedFields = Object.keys(req.body);
  const isValidOperation = updatedFields.every((field) =>
    validFields.includes(field)
  );
  if (!isValidOperation)
    return res.status(400).json({ error: "Invalid fields" });

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) return res.status(404).json("Not found");
    updatedFields.forEach((field) => (task[field] = req.body[field]));
    await task.save();
    res.status(200).json({ task: task });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Delete a task by id
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) return res.status(404).json({ error: "Id not found" });
    await task.remove();
    res.status(200).json({ data: task });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

module.exports = router;
