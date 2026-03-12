import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,           // FIX: always use https URLs
});

// ── Storage engine ───────────────────────────────────────────────────────────
// Using a function for params (not object) — required by newer versions of
// multer-storage-cloudinary to support dynamic resource_type detection.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    // Detect resource type from mimetype so PDFs / videos / images all work
    let resource_type = "auto";
    if (file.mimetype.startsWith("image/")) resource_type = "image";
    else if (file.mimetype.startsWith("video/")) resource_type = "video";
    else resource_type = "raw";   // pdf, doc, ppt…

    return {
      folder: "college-erp",
      resource_type,                               // FIX: was missing for non-images
      allowed_formats: ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "mp4", "webp"],
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };
  },
});

// ── File-size & type guard ───────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4", "video/webm",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },   // 25 MB max
});

// ── Error handler middleware ─────────────────────────────────────────────────
// Wrap around upload middleware in any route to get clean JSON errors.
// Usage:  router.post("/", protect, handleUploadError(upload.single("file")), handler)
export const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File too large. Max size is 25 MB." });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: "Unexpected field name in form data." });
    }
    if (err.message?.startsWith("File type not allowed")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    // Cloudinary API errors
    if (err.http_code) {
      return res.status(err.http_code).json({ success: false, message: err.message });
    }

    console.error("Upload error:", err);
    return res.status(500).json({ success: false, message: "Upload failed. Please try again." });
  });
};

// ── Delete helper ────────────────────────────────────────────────────────────
// Pass the full Cloudinary URL, it extracts the public_id automatically.
export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    // URL pattern: …/v123456/folder/public_id.ext
    const parts = fileUrl.split("/");
    const file = parts[parts.length - 1];                     // public_id.ext
    const folder = parts[parts.length - 2];                     // subfolder
    const publicId = `${folder}/${file.replace(/\.[^/.]+$/, "")}`; // strip extension

    // Determine resource_type from extension for correct deletion
    const ext = file.split(".").pop().toLowerCase();
    const resource_type =
      ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? "image" :
        ["mp4", "webm"].includes(ext) ? "video" : "raw";

    return await cloudinary.uploader.destroy(publicId, { resource_type });
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

export default cloudinary;