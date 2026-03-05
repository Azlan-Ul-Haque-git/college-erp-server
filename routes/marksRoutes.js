import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Marks from "../models/Marks.js";
import Student from "../models/Student.js";
import asyncHandler from "express-async-handler";
import axios from "axios";

const router = express.Router();

router.post("/bulk", protect, authorizeRoles("faculty","admin"), asyncHandler(async (req, res) => {
  const { records } = req.body;
  for (const rec of records) {
    await Marks.findOneAndUpdate(
      { student:rec.student, subject:rec.subject, semester:rec.semester },
      rec, { upsert:true, new:true }
    );
  }
  res.json({ success:true, message:"Marks saved" });
}));

router.get("/my-marks", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(404); throw new Error("Not found"); }
  const marks = await Marks.find({ student: student._id });
  res.json({ success:true, marks });
}));

router.post("/predict", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const marks = await Marks.find({ student: student?._id });
  try {
    const { data } = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, { marks });
    res.json(data);
  } catch {
    const avg = marks.length ? marks.reduce((a,m) => a + m.total, 0) / marks.length : 70;
    res.json({ predictedCGPA: (avg/10).toFixed(1), riskLevel: avg<50?"High":avg<65?"Medium":"Low",
      suggestions:["Keep maintaining your attendance above 75%","Focus on weak subjects","Practice previous year papers"] });
  }
}));

export default router;
