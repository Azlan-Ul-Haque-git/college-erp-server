import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Leave from "../models/Leave.js";

const router = express.Router();

// Apply leave
router.post("/", protect, asyncHandler(async (req, res) => {
  const leave = await Leave.create({ ...req.body, appliedBy: req.user._id, role: req.user.role });
  res.status(201).json({ success: true, leave });
}));

// Get my leaves
router.get("/my", protect, asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ appliedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, leaves });
}));

// Admin — get all leaves
router.get("/all", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const leaves = await Leave.find().populate("appliedBy", "name email").sort({ createdAt: -1 });
  res.json({ success: true, leaves });
}));

// Admin — approve/reject
router.put("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, leave });
}));

export default router;