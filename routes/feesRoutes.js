import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Fees from "../models/Fees.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

const router = express.Router();

/* ═════════════════════════════════════════════════════════════════════════
   GET /api/fees/students-list  — admin + faculty
   Fee form ke dropdown ke liye students list
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/students-list",
  protect,
  authorizeRoles("admin", "faculty"),
  asyncHandler(async (req, res) => {
    const students = await User.find({ role: "student" })
      .select("name email rollNumber branch semester year section")
      .sort({ name: 1 });

    res.json({ success: true, data: students });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   GET /api/fees/my-fees  — student only
   MUST be before "/" route warna "/:id" se clash ho jaayega
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/my-fees",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    // Latest fee record — single object return karo
    const fees = await Fees.findOne({ student: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      fees: fees || null,
    });
  })
);
/* ═════════════════════════════════════════════════════════════════════════
   GET /api/fees  — admin only
   Saari fees, student details ke saath
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const fees = await Fees.find()
      .populate("student", "name email rollNumber branch semester year section")
      .sort({ createdAt: -1 });

    res.json({ success: true, fees });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   POST /api/fees  — admin only  (YEH MISSING THA!)
   Naya fee record create karo
   ═════════════════════════════════════════════════════════════════════════ */
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const {
      student,
      totalAmount,
      paidAmount,
      semester,
      academicYear,
      dueDate,
    } = req.body;

    // Validation
    if (!student || !totalAmount) {
      res.status(400);
      throw new Error("Student and total amount are required.");
    }

    // Student exist karta hai ya nahi
    const studentExists = await User.findById(student);
    if (!studentExists || studentExists.role !== "student") {
      res.status(404);
      throw new Error("Student not found.");
    }

    // Duplicate check (same student + same semester + same year)
    const existing = await Fees.findOne({
      student,
      semester: Number(semester) || 1,
      academicYear: academicYear || "2024-25",
    });

    if (existing) {
      res.status(409);
      throw new Error(
        "Fee record already exists for this student for this semester."
      );
    }

    const fee = await Fees.create({
      student,
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount) || 0,
      semester: Number(semester) || 1,
      academicYear: academicYear || "2024-25",
      dueDate: dueDate || null,
    });
    await Notification.create({
      user: student,
      title: "💰 Fee Record Added",
      message: `₹${totalAmount} total fee added for Semester ${semester}. Due: ₹${totalAmount - (Number(paidAmount) || 0)}`,
      type: "fee",
    });

    // Populated response
    const populated = await Fees.findById(fee._id).populate(
      "student",
      "name email rollNumber branch"
    );

    res.status(201).json({
      success: true,
      message: "Fee record added.",
      fee: populated,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   PUT /api/fees/:id  — admin only
   Fee record update karo (paidAmount mostly)
   ═════════════════════════════════════════════════════════════════════════ */
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };

    // Types ensure karo
    if (updates.totalAmount !== undefined) {
      updates.totalAmount = Number(updates.totalAmount);
    }
    if (updates.paidAmount !== undefined) {
      updates.paidAmount = Number(updates.paidAmount);
    }
    if (updates.semester !== undefined) {
      updates.semester = Number(updates.semester);
    }

    const fee = await Fees.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("student", "name email rollNumber branch");

    if (!fee) {
      res.status(404);
      throw new Error("Fee record not found.");
    }
    if (updates.paidAmount !== undefined) {
      await Notification.create({
        user: fee.student._id,
        title: "💰 Fee Payment Updated",
        message: `Payment of ₹${updates.paidAmount} recorded. Due: ₹${fee.dueAmount}`,
        type: "fee",
      });
    }

    res.json({ success: true, fee });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   DELETE /api/fees/:id  — admin only
   ═════════════════════════════════════════════════════════════════════════ */
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const fee = await Fees.findByIdAndDelete(req.params.id);

    if (!fee) {
      res.status(404);
      throw new Error("Fee record not found.");
    }
    await Notification.create({
      user: fee.student,
      title: "⚠️ Fee Record Removed",
      message: "Your fee record has been removed by admin. Contact office for details.",
      type: "fee",
    });

    res.json({ success: true, message: "Fee record deleted." });
  })
);

export default router;