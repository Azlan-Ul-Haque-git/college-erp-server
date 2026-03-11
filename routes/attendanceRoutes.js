import express from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

const COLLEGE_LAT = 23.1677;
const COLLEGE_LNG = 79.9348;
const ALLOWED_RADIUS_METERS = 5000; // 5km — relaxed for testing

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Student checkin ──────────────────────────────────────────────────────────
router.post("/student-checkin", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const { latitude, longitude, selfie, subject } = req.body;

  if (!subject) { res.status(400); throw new Error("Subject required"); }

  const distance = getDistance(latitude, longitude, COLLEGE_LAT, COLLEGE_LNG);
  if (distance > ALLOWED_RADIUS_METERS) {
    res.status(400);
    throw new Error(`You are ${Math.round(distance)}m away from college. Come to college location.`);
  }

  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(404); throw new Error("Student profile not found"); }

  const today = new Date().toISOString().split("T")[0];

  const existing = await Attendance.findOne({ student: student._id, subject, date: today });
  if (existing) {
    res.status(400);
    throw new Error("Attendance already marked for this subject today!");
  }

  const attendance = await Attendance.create({
    student: student._id,
    subject, date: today, selfie,
    latitude, longitude,
    status: "pending",
    checkinTime: new Date(),
    type: "student",
  });

  res.json({ success: true, message: "Attendance submitted! Faculty will verify soon.", attendance });
}));

// ── Student my attendance ────────────────────────────────────────────────────
router.get("/my", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(404); throw new Error("Student not found"); }
  const records = await Attendance.find({ student: student._id, type: "student" }).sort({ date: -1 });
  res.json({ success: true, data: records });
}));

// ── Student attendance summary (subject-wise) ────────────────────────────────
router.get("/my-summary", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(404); throw new Error("Student not found"); }

  const records = await Attendance.find({ student: student._id, type: "student" });

  // Group by subject
  const subjectMap = {};
  records.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { present: 0, total: 0 };
    if (r.status !== "pending") {
      subjectMap[r.subject].total++;
      if (r.status === "present") subjectMap[r.subject].present++;
    }
  });

  const summary = Object.entries(subjectMap).map(([subject, s]) => ({
    subject,
    present: s.present,
    total: s.total,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  res.json({ success: true, summary });
}));

// ── Faculty gets pending attendance to verify ────────────────────────────────
router.get("/pending", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const { subject, date } = req.query;
  const today = date || new Date().toISOString().split("T")[0];
  const filter = { status: "pending", type: "student", date: today };
  if (subject) filter.subject = subject;

  const pending = await Attendance.find(filter).populate({
    path: "student",
    populate: { path: "user", select: "name email avatar" },
  });

  res.json({ success: true, data: pending });
}));

// ── Faculty verifies student attendance ─────────────────────────────────────
router.put("/verify/:id", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["present", "absent"].includes(status)) { res.status(400); throw new Error("Invalid status"); }

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status, verifiedBy: req.user._id, verifiedAt: new Date() },
    { new: true }
  );
  if (!attendance) { res.status(404); throw new Error("Record not found"); }

  res.json({ success: true, message: `Marked as ${status}!`, attendance });
}));

// ── Faculty checkin ──────────────────────────────────────────────────────────
router.post("/faculty-checkin", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  const distance = getDistance(latitude, longitude, COLLEGE_LAT, COLLEGE_LNG);
  if (distance > ALLOWED_RADIUS_METERS) {
    res.status(400);
    throw new Error(`You are ${Math.round(distance)}m away from college!`);
  }

  const today = new Date().toISOString().split("T")[0];
  const existing = await Attendance.findOne({ faculty: req.user._id, date: today, type: "faculty" });
  if (existing) { res.status(400); throw new Error("Today's attendance already marked!"); }

  const attendance = await Attendance.create({
    faculty: req.user._id,
    date: today, latitude, longitude,
    status: "present",
    type: "faculty",
    checkinTime: new Date(),
  });

  res.json({ success: true, message: "Faculty attendance marked!", attendance });
}));

// ── Faculty my attendance history ────────────────────────────────────────────
router.get("/faculty-my", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const records = await Attendance.find({ faculty: req.user._id, type: "faculty" }).sort({ date: -1 });
  res.json({ success: true, data: records });
}));

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get("/faculty-records", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const records = await Attendance.find({ type: "faculty" })
    .populate("faculty", "name email")
    .sort({ date: -1 });
  res.json({ success: true, data: records });
}));

router.get("/all", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const records = await Attendance.find()
    .populate({ path: "student", populate: { path: "user", select: "name email" } })
    .populate("faculty", "name email")
    .sort({ date: -1 });
  res.json({ success: true, data: records });
}));

export default router;