import express from "express";
import { upload, handleUploadError } from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

// POST /api/upload
// Uses handleUploadError wrapper → returns clean JSON on any multer/cloudinary error
router.post(
  "/",
  protect,
  handleUploadError(upload.single("file")),   // ← clean error handling
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    res.json({
      success: true,
      url: req.file.path,          // Cloudinary secure URL
      type: req.file.mimetype,
      name: req.file.originalname,
      size: req.file.size,
    });
  })
);

export default router;