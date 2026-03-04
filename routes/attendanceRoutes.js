import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { Attendance } from "../models/Attendance.js";
import { Student } from "../models/Student.js";
import { sendAttendanceAlert } from "../utils/sendEmail.js";
import asyncHandler from "express-async-handler";
import axios from "axios";

const router = express.Router();

router.post("/bulk", protect, authorizeRoles("faculty","admin"), asyncHandler(async (req, res) => {
  const { records } = req.body;
  await Attendance.insertMany(records);

  // Check for low attendance and send alerts
  for (const rec of records) {
    if (rec.status === "Absent") {
      const total   = await Attendance.countDocuments({ student:rec.student, subject:rec.subject });
      const present = await Attendance.countDocuments({ student:rec.student, subject:rec.subject, status:"Present" });
      const pct = Math.round((present/total)*100);
      if (pct < 75) {
        const student = await Student.findById(rec.student).populate("user","name email");
        if (student?.user?.email) {
          sendAttendanceAlert(student.user.email, student.user.name, pct, rec.subject).catch(()=>{});
        }
      }
    }
  }
  res.json({ success:true, message:"Attendance saved" });
}));

router.get("/my-summary", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) { res.status(404); throw new Error("Student not found"); }
  const records = await Attendance.find({ student: student._id });
  const subjectMap = {};
  records.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { present:0, total:0 };
    subjectMap[r.subject].total++;
    if (r.status === "Present") subjectMap[r.subject].present++;
  });
  const summary = Object.entries(subjectMap).map(([subject, data]) => ({
    subject, ...data, percentage: Math.round((data.present/data.total)*100)
  }));
  res.json({ success:true, summary });
}));

router.post("/face-recognize", protect, asyncHandler(async (req, res) => {
  const { image, studentIds } = req.body;
  try {
    const { data } = await axios.post(`${process.env.FACE_SERVICE_URL}/recognize`, { image, studentIds });
    res.json(data);
  } catch {
    res.status(500).json({ success:false, message:"Face service unavailable" });
  }
}));

export default router;
