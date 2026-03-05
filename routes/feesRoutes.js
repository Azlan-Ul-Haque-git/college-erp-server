import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Fees from "../models/Fees.js";
import Student from "../models/Student.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const fees = await Fees.find().populate({ path:"student", populate:{ path:"user", select:"name" }});
  res.json({ success:true, fees });
}));

router.get("/my-fees", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const fees = await Fees.findOne({ student: student?._id }).sort({ createdAt:-1 });
  res.json({ success:true, fees });
}));

router.post("/", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const fee = await Fees.create(req.body);
  res.status(201).json({ success:true, fee });
}));

export default router;
