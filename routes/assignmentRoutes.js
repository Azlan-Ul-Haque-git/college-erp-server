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
    try {
      console.log("========== /student START ==========");
      console.log("req.user:", JSON.stringify(req.user));

      const student = await User.findById(req.user._id);
      console.log("student:", student ? {
        id: student._id,
        branch: student.branch,
        semester: student.semester,
        role: student.role,
      } : "NULL");

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      const allAssignments = await Assignment.find();
      console.log("total assignments:", allAssignments.length);

      const studentBranch = (student.branch || "").toUpperCase().trim();
      const studentSem = Number(student.semester) || 1;

      const filtered = allAssignments.filter((a) => {
        const aBranch = (a.branch || "").toUpperCase().trim();
        const aSem = a.semester == null ? null : Number(a.semester);
        const branchMatch = aBranch === studentBranch || aBranch === "ALL";
        const semMatch = aSem === null || aSem === studentSem;
        return branchMatch && semMatch;
      });

      console.log("matched:", filtered.length);
      console.log("========== /student END ==========");

      // populate manually
      const populated = await Assignment.populate(filtered, {
        path: "createdBy",
        select: "name email",
      });

      res.json({
        success: true,
        count: filtered.length,
        assignments: populated,
      });
    } catch (err) {
      console.error("❌ /student ERROR:", err.message);
      console.error("❌ STACK:", err.stack);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
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