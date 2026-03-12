import express from "express";
import asyncHandler from "express-async-handler";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

const router = express.Router();

// ── Helper: today's date range ─────────────────────────────────────────────
const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/attendance/checkin  — student or faculty self check-in
// ══════════════════════════════════════════════════════════════════════════════
router.post("/checkin", protect, asyncHandler(async (req, res) => {
  const { start, end } = todayRange();

  const existing = await Attendance.findOne({ user: req.user._id, date: { $gte: start, $lt: end } });

  if (existing?.checkIn?.time) {
    res.status(400);
    throw new Error("You have already checked in today.");
  }

  let record;
  if (existing) {
    existing.checkIn = { time: new Date(), method: "checkin" };
    existing.approvalStatus = "pending";
    existing.status = "present";
    record = await existing.save();
  } else {
    record = await Attendance.create({
      user: req.user._id,
      userType: req.user.role === "faculty" ? "faculty" : "student",
      date: new Date(),
      status: "present",
      approvalStatus: "pending",
      checkIn: { time: new Date(), method: "checkin" },
    });
  }

  res.json({ success: true, message: "Checked in. Awaiting admin approval.", data: record });
}));

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/attendance/checkout  — self check-out
// ══════════════════════════════════════════════════════════════════════════════
router.post("/checkout", protect, asyncHandler(async (req, res) => {
  const { start, end } = todayRange();

  const record = await Attendance.findOne({ user: req.user._id, date: { $gte: start, $lt: end } });

  if (!record?.checkIn?.time) {
    res.status(400);
    throw new Error("You must check in before checking out.");
  }
  if (record.checkOut?.time) {
    res.status(400);
    throw new Error("You have already checked out today.");
  }

  record.checkOut = { time: new Date(), method: "checkin" };
  await record.save();   // pre-save hook calculates workingHours

  res.json({ success: true, message: "Checked out.", data: record });
}));

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/attendance/my-status  — today's record for logged-in user
// ══════════════════════════════════════════════════════════════════════════════
router.get("/my-status", protect, asyncHandler(async (req, res) => {
  const { start, end } = todayRange();
  const record = await Attendance.findOne({ user: req.user._id, date: { $gte: start, $lt: end } });
  res.json({ success: true, data: record || null });
}));

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/attendance/pending-approvals  — admin only
// ══════════════════════════════════════════════════════════════════════════════
router.get(
  "/pending-approvals",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (_req, res) => {
    const records = await Attendance.find({ approvalStatus: "pending" })
      .populate("user", "name email rollNumber employeeId role profilePicture")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/attendance/:id/approve  — admin approve / reject
// Body: { action: "approve"|"reject", reason?: string }
// ══════════════════════════════════════════════════════════════════════════════
router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { action, reason } = req.body;
    if (!["approve", "reject"].includes(action)) {
      res.status(400);
      throw new Error("action must be 'approve' or 'reject'");
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) { res.status(404); throw new Error("Record not found"); }

    record.approvalStatus = action === "approve" ? "approved" : "rejected";
    record.approvedBy = req.user._id;
    record.approvedAt = new Date();
    record.rejectionReason = action === "reject" ? reason : undefined;
    if (action === "reject") record.status = "absent";

    await record.save();
    res.json({ success: true, message: `Attendance ${action}d.`, data: record });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/attendance/bulk-approve  — admin bulk approve all pending
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/bulk-approve",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const result = await Attendance.updateMany(
      { approvalStatus: "pending" },
      { $set: { approvalStatus: "approved", approvedBy: req.user._id, approvedAt: new Date() } }
    );
    res.json({ success: true, message: `${result.modifiedCount} records approved.` });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/attendance/mark  — faculty / admin mark a student
// Body: { studentId, date, status, subject, course, semester, section }
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/mark",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {
    const { studentId, date, status, subject, course, semester, section, remarks } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student not found");
    }

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { user: studentId, date: { $gte: d, $lt: new Date(d.getTime() + 86_400_000) } },
      {
        $set: {
          user: studentId, userType: "student", date: d,
          status, subject, course, semester, section, remarks,
          markedBy: req.user._id, approvalStatus: "not_required",
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: record });
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/attendance  — filtered list
// Query: userId, course, from, to, userType, status, approvalStatus
// ══════════════════════════════════════════════════════════════════════════════
router.get("/", protect, asyncHandler(async (req, res) => {
  const { userId, course, from, to, userType, status, approvalStatus } = req.query;
  const filter = {};

  // Students see only their own records
  if (req.user.role === "student") {
    filter.user = req.user._id;
  } else if (userId) {
    filter.user = userId;
  }

  if (userType) filter.userType = userType;
  if (course) filter.course = course;
  if (status) filter.status = status;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Attendance.find(filter)
    .populate("user", "name email rollNumber employeeId role profilePicture")
    .populate("markedBy", "name")
    .populate("approvedBy", "name")
    .sort({ date: -1 })
    .limit(500);

  res.json({ success: true, count: records.length, data: records });
}));

export default router;