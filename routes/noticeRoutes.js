import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { Notice } from "../models/Notice.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, asyncHandler(async (req, res) => {
  const filter = { isActive:true };
  if (req.user.role !== "admin") filter.targetRole = { $in:["all", req.user.role] };
  const notices = await Notice.find(filter).populate("postedBy","name").sort({ createdAt:-1 });
  res.json({ success:true, notices });
}));

router.post("/", protect, asyncHandler(async (req, res) => {
  const notice = await Notice.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json({ success:true, notice });
}));

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  await Notice.findByIdAndUpdate(req.params.id, { isActive:false });
  res.json({ success:true, message:"Notice removed" });
}));

export default router;
