import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const exam = await Exam.create(req.body);
  res.status(201).json({ success: true, exam });
}));

router.get("/student", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const exams = await Exam.find({
    $or: [{ branch: student?.branch }, { branch: "ALL" }],
    semester: student?.semester
  }).sort({ examDate: 1 });
  res.json({ success: true, exams });
}));

router.get("/all", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const exams = await Exam.find().sort({ examDate: 1 });
  res.json({ success: true, exams });
}));

router.delete("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

export default router;