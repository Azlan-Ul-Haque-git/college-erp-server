import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Note from "../models/Note.js";
import Student from "../models/Student.js";

const router = express.Router();

// Faculty — upload note
router.post(
  "/",
  protect,
  authorizeRoles("faculty"),
  asyncHandler(async (req, res) => {

    const {
      title,
      subject,
      fileUrl
    } = req.body;

    if (!title || !subject || !fileUrl) {
      res.status(400);
      throw new Error("Title, subject and file required");
    }

    const note = await Note.create({
      ...req.body,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      note
    });

  }));
// Faculty — my notes
router.get("/my", protect, authorizeRoles("faculty"), asyncHandler(async (req, res) => {
  const notes = await Note.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, notes });
}));

// Student — get notes
router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {

    const student =
      await Student.findOne({
        user: req.user._id
      });

    const notes = await Note.find({
      $and: [
        {
          $or: [
            { branch: student?.branch },
            { branch: "ALL" }
          ]
        },
        {
          $or: [
            { semester: student?.semester },
            { semester: null }
          ]
        }
      ]
    })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes
    });

  }));

// Delete
router.delete(
  "/:id",
  protect,
  authorizeRoles("faculty", "admin"),
  asyncHandler(async (req, res) => {

    const note = await Note.findById(req.params.id);

    if (!note) {
      res.status(404);
      throw new Error("Note not found");
    }

    if (
      req.user.role !== "admin" &&
      note.uploadedBy.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("Not allowed");
    }

    await note.deleteOne();

    res.json({ success: true });

  }));
export default router;