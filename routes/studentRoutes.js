import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/students  — admin + faculty
// Query: course, semester, section, branch, search
// ══════════════════════════════════════════════════════════════════════════════
router.get(
  "/",
  protect,
  authorizeRoles("admin", "faculty"),
  asyncHandler(async (req, res) => {
    const { course, semester, section, branch, search } = req.query;
    const filter = { role: "student" };

    if (course) filter.course = new RegExp(course, "i");
    if (semester) filter.semester = semester;
    if (section) filter.section = new RegExp(section, "i");
    if (branch) filter.branch = new RegExp(branch, "i");
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { rollNumber: new RegExp(search, "i") },
      ];
    }

    const students = await User.find(filter).select("-password").sort({ name: 1 }).limit(500);
    res.json({ success: true, count: students.length, data: students });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/students/add  — admin + faculty
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/add",
  protect,
  authorizeRoles("admin", "faculty"),
  asyncHandler(async (req, res) => {
    const {
      name, email, password, rollNumber,
      course, semester, section, branch, phone,
      bloodGroup, fatherName, motherName, address, academicYear,
    } = req.body;

    if (!name || !email || !password || !rollNumber) {
      res.status(400);
      throw new Error("Name, email, password and roll number are required.");
    }

    const existing = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (existing) {
      res.status(409);
      throw new Error(
        existing.email === email ? "Email already registered." : "Roll number already exists."
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const student = await User.create({
      name, email, password: hashed, role: "student",
      rollNumber, course, semester, section, branch, phone,
      bloodGroup, fatherName, motherName, address, academicYear,
      addedBy: req.user._id,
    });

    const { password: _, ...data } = student.toObject();
    res.status(201).json({ success: true, message: `Student "${name}" added.`, data });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/students/:id  — admin + faculty + own student
// ══════════════════════════════════════════════════════════════════════════════
router.get("/:id", protect, asyncHandler(async (req, res) => {
  if (req.user.role === "student" && req.user._id.toString() !== req.params.id) {
    res.status(403); throw new Error("Access denied.");
  }

  const student = await User.findById(req.params.id).select("-password");
  if (!student || student.role !== "student") { res.status(404); throw new Error("Student not found."); }

  res.json({ success: true, data: student });
}));

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/students/:id  — admin only
// ══════════════════════════════════════════════════════════════════════════════
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;

    const student = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select("-password");
    if (!student) { res.status(404); throw new Error("Student not found."); }

    res.json({ success: true, data: student });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/students/:id  — admin only
// ══════════════════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Student deleted." });
  })
);

export default router;