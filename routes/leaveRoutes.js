import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Leave from "../models/Leave.js";

const router = express.Router();

/* Apply leave */
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const leave = await Leave.create({
      ...req.body,
      appliedBy: req.user._id,
      role: req.user.role,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      leave
    });
  })
);

/* My leaves */
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const leaves = await Leave.find({
      appliedBy: req.user._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      leaves
    });
  })
);

/* Admin + Faculty view leaves */
router.get(
  "/all",
  protect,
  authorizeRoles("admin", "faculty"),
  asyncHandler(async (req, res) => {

    let filter = {};

    // Faculty will only see students leave 
    if (req.user.role === "faculty") {
      filter.role = "student";
    }

    const leaves = await Leave.find(filter)
      .populate("appliedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leaves
    });

  })
);

/* Admin + Faculty approve/reject */
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "faculty"),
  asyncHandler(async (req, res) => {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404);
      throw new Error("Leave not found");
    }

    // Faculty only student leave approve kar sake
    if (
      req.user.role === "faculty" &&
      leave.role !== "student"
    ) {
      res.status(403);
      throw new Error("Not allowed");
    }

    leave.status = req.body.status;
    await leave.save();

    res.json({
      success: true,
      leave
    });
  })
);

export default router;