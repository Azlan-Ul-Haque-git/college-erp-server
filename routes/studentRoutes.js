import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { Student } from "../models/Student.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, asyncHandler(async (req, res) => {
  const { branch, year, section, search } = req.query;
  const filter = {};
  if (branch)  filter.branch  = branch;
  if (year)    filter.year    = +year;
  if (section) filter.section = section;
  const students = await Student.find(filter).populate("user", "name email phone avatar").select("-faceData");
  res.json({ success:true, students, count: students.length });
}));

router.get("/:id", protect, asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("user", "name email phone").select("-faceData");
  if (!student) { res.status(404); throw new Error("Student not found"); }
  res.json({ success:true, student });
}));

router.put("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const { name, phone, ...rest } = req.body;
  const student = await Student.findByIdAndUpdate(req.params.id, rest, { new:true }).populate("user");
  if (name || phone) await student.user.updateOne({ name, phone });
  res.json({ success:true, student });
}));

router.delete("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error("Not found"); }
  await student.user.deleteOne();
  await student.deleteOne();
  res.json({ success:true, message:"Student deleted" });
}));

export default router;
