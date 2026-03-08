import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Assignment from "../models/Assignment.js";
import Student from "../models/Student.js";

const router = express.Router();

// Faculty — create assignment
router.post("/", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, assignment });
}));

// Faculty — get my assignments
router.get("/my", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, assignments });
}));

// Student — get assignments for their branch/semester
router.get("/student", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const assignments = await Assignment.find({
    $or: [{ branch: student?.branch }, { branch: "ALL" }],
    semester: student?.semester
  }).populate("createdBy", "name").sort({ createdAt: -1 });
  res.json({ success: true, assignments });
}));

// Faculty — delete
router.delete("/:id", protect, authorizeRoles("faculty", "admin"), asyncHandler(async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

export default router;