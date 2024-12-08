const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  responsible: { type: String, required: true },
  status: { type: String, enum: ["en_cours", "fait", "bloque"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // إضافة userId
});

module.exports = mongoose.model("Task", TaskSchema);
