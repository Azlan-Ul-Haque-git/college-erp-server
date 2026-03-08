import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Grievance from "../models/Grievance.js";

const router = express.Router();

router.post("/", protect, asyncHandler(async (req, res) => {
  const grievance = await Grievance.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json({ success: true, grievance });
}));

router.get("/my", protect, asyncHandler(async (req, res) => {
  const grievances = await Grievance.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, grievances });
}));

router.get("/all", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const grievances = await Grievance.find().populate("submittedBy", "name email").sort({ createdAt: -1 });
  res.json({ success: true, grievances });
}));

router.put("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const grievance = await Grievance.findByIdAndUpdate(req.params.id, { status: req.body.status, adminReply: req.body.adminReply }, { new: true });
  res.json({ success: true, grievance });
}));

export default router;