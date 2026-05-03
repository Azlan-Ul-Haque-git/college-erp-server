import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/* ================= GET ALL ================= */
router.get("/", protect, asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 });

    res.json({ notifications });
}));

/* ================= MARK AS READ ================= */
router.put("/:id/read", protect, asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
}));

/* ================= CLEAR ALL ================= */
router.delete("/", protect, asyncHandler(async (req, res) => {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true });
}));

export default router;