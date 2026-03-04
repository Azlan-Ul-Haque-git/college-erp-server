import express from "express";
import { register, login, getMe, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/login",           login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);
router.get ("/me",              protect, getMe);
router.put ("/change-password", protect, changePassword);
router.post("/register",        protect, authorizeRoles("admin"), register);
export default router;
