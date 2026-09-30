import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Assignment from "../models/Assignment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";   // ← Student hatao, User use karo

const router = express.Router();

/* ═════════════════════════════════════════════════════════════════════════
   Faculty — Create assignment
   ═════════════════════════════════════════════════════════════════════════ */


router.post("/", protect, authorizeRoles("faculty", "admin"), asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Us branch/semester ke saare students ko notify karo
  const students = await User.find({
    role: "student",
    branch: assignment.branch,
    semester: assignment.semester,
  });

  if (students.length > 0) {
    await Notification.insertMany(
      students.map((s) => ({
        user: s._id,
        title: "📝 New Assignment",
        message: `${assignment.title} — due ${new Date(assignment.dueDate).toLocaleDateString("en-IN")}`,
        type: "assignment",
      }))
    );
  }

  res.status(201).json({ success: true, assignment });
}));

/* ═════════════════════════════════════════════════════════════════════════
   Faculty — Get ALL assignments (sab faculty ke, sirf apne nahi)
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/faculty",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {
    const assignments = await Assignment.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Faculty — Get MY assignments (purana route, backward compatible)
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/my",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {
    const assignments = await Assignment.find({ createdBy: req.user._id })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Student — Get assignments for their branch + semester
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    // Student data ab User collection mein hai
    const student = await User.findById(req.user._id);

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const assignments = await Assignment.find({
      $and: [
        {
          $or: [
            { branch: student.branch },
            { branch: "ALL" },
          ],
        },
        {
          $or: [
            { semester: student.semester },
            { semester: null },
            { semester: "ALL" },
          ],
        },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Faculty/Admin — Delete assignment
   ═════════════════════════════════════════════════════════════════════════ */
router.delete(
  "/:id",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }

    // Faculty sirf apne assignments delete kar sakta hai
    if (
      req.user.role === "faculty" &&
      assignment.createdBy.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("You can only delete your own assignments");
    }

    await assignment.deleteOne();

    res.json({ success: true, message: "Assignment deleted" });
  })
);

export default router;