import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Note from "../models/Note.js";
import User from "../models/User.js";   // ← Student hatao, User import karo

const router = express.Router();

/* ═════════════════════════════════════════════════════════════════════════
   Faculty — Upload note
   ═════════════════════════════════════════════════════════════════════════ */
router.post(
  "/",
  protect,
  authorizeRoles("faculty"),
  asyncHandler(async (req, res) => {
    const { title, subject, fileUrl } = req.body;

    if (!title || !subject || !fileUrl) {
      res.status(400);
      throw new Error("Title, subject and file required");
    }

    const note = await Note.create({
      ...req.body,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      note,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Faculty — My notes
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/my",
  protect,
  authorizeRoles("faculty"),
  asyncHandler(async (req, res) => {
    const notes = await Note.find({ uploadedBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, notes });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Student — Get notes for their branch + semester
   ═════════════════════════════════════════════════════════════════════════ */
router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    // Ab student data User collection mein hai
    const student = await User.findById(req.user._id);

    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const notes = await Note.find({
      $and: [
        {
          $or: [
            { branch: student.branch },
            { branch: "ALL" },
          ],
        },
        {
          $or: [
            { semester: student.semester },
            { semester: null },
          ],
        },
      ],
    })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notes.length,
      notes,
    });
  })
);

/* ═════════════════════════════════════════════════════════════════════════
   Delete note
   ═════════════════════════════════════════════════════════════════════════ */
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
  })
);

export default router;