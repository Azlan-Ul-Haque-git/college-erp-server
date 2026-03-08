import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Note from "../models/Note.js";
import Student from "../models/Student.js";

const router = express.Router();

// Faculty — upload note
router.post("/", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const note = await Note.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json({ success: true, note });
}));

// Faculty — my notes
router.get("/my", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const notes = await Note.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, notes });
}));

// Student — get notes
router.get("/student", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const notes = await Note.find({
    $or: [{ branch: student?.branch }, { branch: "ALL" }]
  }).populate("uploadedBy", "name").sort({ createdAt: -1 });
  res.json({ success: true, notes });
}));

// Delete
router.delete("/:id", protect, authorizeRoles("faculty", "admin"), asyncHandler(async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

export default router;