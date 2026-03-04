import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { Timetable } from "../models/Timetable.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, asyncHandler(async (req, res) => {
  const { branch, year, semester } = req.query;
  const filter = {};
  if (branch)   filter.branch   = branch;
  if (year)     filter.year     = +year;
  if (semester) filter.semester = +semester;
  const timetable = await Timetable.find(filter).populate("slots.faculty", "user");
  res.json({ success:true, timetable });
}));

router.post("/", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const tt = await Timetable.create(req.body);
  res.status(201).json({ success:true, timetable:tt });
}));

export default router;
