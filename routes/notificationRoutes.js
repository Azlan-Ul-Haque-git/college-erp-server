import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);

router.put("/:id/read", protect, markAsRead);

export default router;