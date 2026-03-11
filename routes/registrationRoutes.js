import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";

const router = express.Router();

// Public — submit registration request
router.post("/", asyncHandler(async (req, res) => {
  const { email } = req.body;
  const exists = await Registration.findOne({ email });
  if (exists) { res.status(400); throw new Error("Registration request already submitted for this email"); }
  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error("Email already registered"); }
  const registration = await Registration.create(req.body);
  res.status(201).json({ success: true, message: "Registration request submitted! Admin will review it.", registration });
}));

// Admin — get all pending registrations
router.get("/", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const registrations = await Registration.find().sort({ createdAt: -1 });
  res.json({ success: true, registrations });
}));

// Admin — approve registration
router.put("/:id/approve", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) { res.status(404); throw new Error("Registration not found"); }

  // Create User
  const hashedPassword = await bcrypt.hash(reg.password, 10);
  const user = await User.create({
    name: reg.name, email: reg.email,
    password: hashedPassword, role: reg.role, phone: reg.phone,
  });

  // Create Student or Faculty profile
  if (reg.role === "student") {
    await Student.create({
      user: user._id, rollNo: reg.rollNo || `STU${Date.now()}`,
      branch: reg.branch || "CSE", semester: reg.semester || 1,
      year: reg.year || 1, section: reg.section || "A",
    });
  } else if (reg.role === "faculty") {
    await Faculty.create({
      user: user._id, department: reg.department || "CSE",
      designation: reg.designation || "Lecturer",
      employeeId: `FAC${Date.now()}`,
    });
  }

  await Registration.findByIdAndUpdate(reg._id, { status: "Approved" });
  res.json({ success: true, message: "Registration approved! User can now login." });
}));

// Admin — reject registration
router.put("/:id/reject", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  await Registration.findByIdAndUpdate(req.params.id, { status: "Rejected", adminRemarks: req.body.remarks || "" });
  res.json({ success: true, message: "Registration rejected." });
}));

// Admin — delete registration
router.delete("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  await Registration.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

export default router;