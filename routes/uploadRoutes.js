import express from "express";
import { upload } from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.post("/", protect, upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error("No file uploaded"); }
  res.json({
    success: true,
    url: req.file.path,
    type: req.file.mimetype,
    name: req.file.originalname,
  });
}));

export default router;