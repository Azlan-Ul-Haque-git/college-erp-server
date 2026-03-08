import express from "express";
import asyncHandler from "express-async-handler";
import { register, login, getMe, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/register", protect, authorizeRoles("admin"), register);

router.put("/update-profile", protect, asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email, phone }, { new: true }).select("-password");
    res.json({ success: true, user });
}));

router.put("/update-avatar", protect, asyncHandler(async (req, res) => {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true }).select("-password");
    res.json({ success: true, user });
}));

export default router;