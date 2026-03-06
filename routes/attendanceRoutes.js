import express from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// College location config
const COLLEGE_LAT = 23.1677;
const COLLEGE_LNG = 79.9348;
const ALLOWED_RADIUS_METERS = 200;

// Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @route POST /api/attendance/student-checkin
// @desc Student submits selfie + location
// @access Student
router.post("/student-checkin", protect, authorize("student"), async (req, res) => {
  try {
    const { latitude, longitude, selfie, subject, date } = req.body;

    // Check location
    const distance = getDistance(latitude, longitude, COLLEGE_LAT, COLLEGE_LNG);
    if (distance > ALLOWED_RADIUS_METERS) {
      return res.status(400).json({
        success: false,
        message: `You are ${Math.round(distance)} meter away from college Come to college Location.`,
      });
    }

    // Find student
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const today = date || new Date().toISOString().split("T")[0];

    // Check if already checked in today for this subject
    const existing = await Attendance.findOne({
      student: student._id,
      subject,
      date: today,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Todays Attendance for this Subject `already marked! If it has not been verified yet, please wait for faculty to verify.",
      });
    }

    // Save checkin with selfie
    const attendance = await Attendance.create({
      student: student._id,
      subject,
      date: today,
      selfie,
      latitude,
      longitude,
      status: "pending", // Faculty will verify later
      checkinTime: new Date(),
    });

    res.json({
      success: true,
      message: "Selfie and location received! Faculty will verify your attendance soon.",
      attendance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/attendance/pending
// @desc Faculty gets pending attendance for verification
// @access Faculty
router.get("/pending", protect, authorize("faculty"), async (req, res) => {
  try {
    const { subject, date } = req.query;
    const today = date || new Date().toISOString().split("T")[0];

    const pending = await Attendance.find({
      subject,
      date: today,
      status: "pending",
    }).populate({
      path: "student",
      populate: { path: "user", select: "name email" },
    });

    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/attendance/verify/:id
// @desc Faculty verifies attendance (present/absent)
// @access Faculty
router.put("/verify/:id", protect, authorize("faculty"), async (req, res) => {
  try {
    const { status } = req.body; // "present" or "absent"

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: `Attendance ${status} mark ho gayi!`, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/attendance/my
// @desc Student gets own attendance
// @access Student
router.get("/my", protect, authorize("student"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const records = await Attendance.find({ student: student._id }).sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/attendance/faculty-checkin
// @desc Faculty marks own attendance
// @access Faculty
router.post("/faculty-checkin", protect, authorize("faculty"), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const distance = getDistance(latitude, longitude, COLLEGE_LAT, COLLEGE_LNG);
    if (distance > ALLOWED_RADIUS_METERS) {
      return res.status(400).json({
        success: false,
        message: `You are ${Math.round(distance)} meter away from the college! Please check in from the college location.`,
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({
      faculty: req.user._id,
      date: today,
      type: "faculty",
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Today's Attendance Already Marked" });
    }
    const attendance = await Attendance.create({
      faculty: req.user._id,
      date: today,
      latitude,
      longitude,
      status: "pending",
      type: "faculty",
      checkinTime: new Date(),
    });

    res.json({ success: true, message: "Faculty attendance mark ho gayi!", attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin gets pending faculty attendance
router.get("/faculty-pending", protect, authorize("admin"), async (req, res) => {
  try {

    const records = await Attendance.find({
      type: "faculty",
      status: "pending"
    }).populate("faculty", "name email");

    res.json({ success: true, data: records });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin verifies faculty attendance
router.put("/faculty-verify/:id", protect, authorize("admin"), async (req, res) => {

  try {

    const { status } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Faculty attendance ${status} mark ho gayi`,
      attendance
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

});
router.get("/all", protect, authorize("admin"), async (req, res) => {

  try {

    const records = await Attendance.find()
      .populate({
        path: "student",
        populate: { path: "user", select: "name email" }
      })
      .populate("faculty", "name email")
      .sort({ date: -1 });

    res.json({ success: true, data: records });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

});
// @route GET /api/attendance/faculty-records
// @desc Admin gets all faculty attendance
// @access Admin
router.get("/faculty-records", protect, authorize("admin"), async (req, res) => {
  try {
    const records = await Attendance.find({ type: "faculty" })
      .populate("faculty", "name email")
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;