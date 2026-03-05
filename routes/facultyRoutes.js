import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Faculty from "../models/Faculty.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, asyncHandler(async (req, res) => {
  const faculty = await Faculty.find().populate("user", "name email phone avatar");
  res.json({ success:true, faculty, count: faculty.length });
}));

router.put("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new:true }).populate("user");
  res.json({ success:true, faculty });
}));

router.delete("/:id", protect, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) { res.status(404); throw new Error("Not found"); }
  await faculty.user.deleteOne();
  await faculty.deleteOne();
  res.json({ success:true, message:"Faculty deleted" });
}));

export default router;
