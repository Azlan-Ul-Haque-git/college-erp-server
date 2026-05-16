import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Notice from "../models/Notice.js";
import Student from "../models/Student.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

/* =========================
   GET NOTICES
========================= */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {

    let notices = [];

    // ================= ADMIN =================
    if (req.user.role === "admin") {

      notices = await Notice.find({
        isActive: true
      })
        .populate("postedBy", "name role")
        .sort({ createdAt: -1 });

    }

    // ================= STUDENT =================
    else if (req.user.role === "student") {

      const student = await Student.findOne({
        user: req.user._id
      });

      notices = await Notice.find({
        isActive: true,

        $or: [

          // ALL USERS
          {
            targetRole: "all"
          },

          // ALL STUDENTS
          {
            targetRole: "student",
            targetStudentStatus: "all"
          },

          // STATUS BASED
          {
            targetRole: "student",
            targetStudentStatus: student?.status || "regular"
          }

        ]

      })
        .populate("postedBy", "name role")
        .sort({ createdAt: -1 });

    }

    // ================= FACULTY =================
    else if (req.user.role === "faculty") {

      notices = await Notice.find({
        isActive: true,

        $or: [

          {
            targetRole: "all"
          },

          {
            targetRole: "faculty"
          }

        ]

      })
        .populate("postedBy", "name role")
        .sort({ createdAt: -1 });

    }

    res.json({
      success: true,
      notices
    });

  })
);

/* =========================
   CREATE NOTICE
========================= */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {

    // STUDENTS CANNOT POST
    if (req.user.role === "student") {

      res.status(403);
      throw new Error("Students cannot post notices");

    }

    // FACULTY CAN ONLY POST FOR STUDENTS
    if (req.user.role === "faculty") {

      req.body.targetRole = "student";

    }

    const notice = await Notice.create({

      ...req.body,

      postedBy: req.user._id,

    });

    res.status(201).json({

      success: true,
      notice,

    });

  })
);

/* =========================
   DELETE NOTICE
========================= */
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {

    await Notice.findByIdAndUpdate(
      req.params.id,
      { isActive: false }
    );

    res.json({
      success: true,
      message: "Notice removed"
    });

  })
);

export default router;