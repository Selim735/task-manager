const express = require("express");
const router = express.Router();
const Task = require("../../models/Task"); // Ensure the path to Task model is correct
const auth = require("../../middleware/auth"); // Middleware to verify token

// Create a new task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, responsible, status, startDate, endDate, deadline } = req.body;

    // Check required fields
    if (!title || !description || !responsible || !status || !startDate || !endDate || !deadline) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: "Start date must be before end date." });
    }

    if (new Date(endDate) > new Date(deadline)) {
      return res.status(400).json({ error: "End date must be before the deadline." });
    }

    // Create new task
    const task = new Task({
      title,
      description,
      responsible,
      status,
      startDate,
      endDate,
      deadline,
      userId: req.user.id, // Attach the user ID to the task
    });

    await task.save();

    res.status(201).json({ message: "Tâche créée avec succès", task });
  } catch (error) {
    console.error("Erreur lors de la création de la tâche :", error);
    res.status(500).json({ error: "Impossible de créer la tâche", details: error.message });
  }
});

// Get all tasks for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }); // Fetch tasks for the logged-in user
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks", details: error.message });
  }
});

// Get a single task by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id }); // تحقق من ملكية المستخدم
    if (!task) {
      return res.status(404).json({ error: "Task not found or you are not authorized to view it." });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task", details: error.message });
  }
});


// Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, responsible, status, startDate, endDate, deadline } = req.body;

    // Validate input fields
    if (!title || !description || !responsible || !status || !startDate || !endDate || !deadline) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: "Start date must be before end date." });
    }

    if (new Date(endDate) > new Date(deadline)) {
      return res.status(400).json({ error: "End date must be before the deadline." });
    }

    // Update task
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // Ensure the task belongs to the user
      { title, description, responsible, status, startDate, endDate, deadline },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found or you are not authorized to update it." });
    }

    res.status(200).json({ message: "Tâche mise à jour avec succès", updatedTask });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour la tâche", details: error.message });
  }
});

// Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id }); // Ensure the task belongs to the user
    if (!task) {
      return res.status(404).json({ error: "Task not found or you are not authorized to delete it." });
    }
    res.status(200).json({ message: "Tâche supprimée avec succès", task });
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
