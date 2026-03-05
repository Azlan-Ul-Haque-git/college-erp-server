import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/users", protect, asyncHandler(async (req, res) => {
  const role = req.user.role === "student" ? "faculty" : "student";
  const users = await User.find({ role, isActive:true }).select("name role avatar");
  res.json({ success:true, users });
}));

router.get("/:userId", protect, asyncHandler(async (req, res) => {
  const roomId = [req.user._id.toString(), req.params.userId].sort().join("_");
  const messages = await Message.find({ roomId }).populate("sender","name avatar").sort({ createdAt:1 });
  await Message.updateMany({ roomId, receiver:req.user._id, isRead:false }, { isRead:true });
  res.json({ success:true, messages });
}));

export default router;
