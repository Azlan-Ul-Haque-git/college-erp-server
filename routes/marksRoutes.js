import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Marks from "../models/Marks.js";
import User from "../models/User.js";   // ← Student hatao, User use karo
import asyncHandler from "express-async-handler";
import axios from "axios";

const router = express.Router();

/* ═════════ BULK UPLOAD (faculty/admin) ═════════ */
router.post(
  "/bulk",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {
    const { records } = req.body;
    for (const rec of records) {
      await Marks.findOneAndUpdate(
        { student: rec.student, subject: rec.subject, semester: rec.semester },
        rec,
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: "Marks saved" });
  })
);

/* ═════════ STUDENT — MY MARKS ═════════ */
router.get(
  "/my-marks",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    // Student data ab User collection mein hai
    const marks = await Marks.find({ student: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: marks.length,
      marks,
    });
  })
);

/* ═════════ STUDENT — AI PREDICTION ═════════ */
router.post(
  "/predict",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const marks = await Marks.find({ student: req.user._id });

    // ML service try karo (agar configured hai)
    try {
      if (process.env.ML_SERVICE_URL && !process.env.ML_SERVICE_URL.includes("localhost")) {
        const { data } = await axios.post(
          `${process.env.ML_SERVICE_URL}/predict`,
          { marks }
        );
        return res.json(data);
      }
    } catch (err) {
      console.log("ML service unavailable, using fallback");
    }

    // Fallback — simple calculation
    const avg = marks.length
      ? marks.reduce((a, m) => a + m.total, 0) / marks.length
      : 70;

    res.json({
      predictedCGPA: (avg / 10).toFixed(1),
      riskLevel: avg < 50 ? "High" : avg < 65 ? "Medium" : "Low",
      suggestions: [
        "Keep maintaining your attendance above 75%",
        "Focus on weak subjects",
        "Practice previous year papers",
      ],
      radarData: marks.slice(0, 6).map((m) => ({
        subject: m.subject?.substring(0, 8) || "Sub",
        score: m.total || 0,
      })),
    });
  })
);

export default router;