import express from "express";
import asyncHandler from "express-async-handler";
import { register, login, getMe, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

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

router.get("/create-admin", asyncHandler(async (req, res) => {

    const exists = await User.findOne({
        email: "azlanulhaque9@gmail.com"
    });

    if (exists) {
        return res.json({
            message: "Admin already exists"
        });
    }

    const admin = await User.create({
        name: "Admin",
        email: "azlanulhaque9@gmail.com",
        password: "Azlankpcadmin123",
        role: "admin"
    });

    res.json({
        success: true,
        message: "Admin created successfully"
    });

}));

export default router;