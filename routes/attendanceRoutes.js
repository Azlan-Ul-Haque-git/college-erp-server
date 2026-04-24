import express from "express";
import asyncHandler from "express-async-handler";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { getDistance } from "geolib";
import { COLLEGE_LOCATION } from "../models/Attendance.js";
import { verifyFace } from "../utils/faceVerify.js";

const router = express.Router();

/* ───────── Helper: today range ───────── */

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

/* ═════════ CHECK IN ═════════ */

router.post(
  "/checkin",
  protect,
  asyncHandler(async (req, res) => {
    const { lat, lng, image } = req.body;

    if (lat === undefined || lng === undefined || !image) {
      res.status(400);
      throw new Error("Location and face image required");
    }

    /* ───── Location verification ───── */

    const distance = getDistance(
      { latitude: Number(lat), longitude: Number(lng) },
      {
        latitude: COLLEGE_LOCATION.lat,
        longitude: COLLEGE_LOCATION.lng,
      }
    );

    if (distance > COLLEGE_LOCATION.radius) {
      res.status(400);
      throw new Error("You are outside college campus");
    }

    /* ───── User fetch ───── */

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (!user.profilePicture) {
      res.status(400);
      throw new Error("Profile picture missing");
    }

    /* ───── Face verification ───── */

    const match = await verifyFace(image, user.profilePicture);

    if (!match) {
      res.status(400);
      throw new Error("Face verification failed");
    }

    const { start, end } = todayRange();

    const existing = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lt: end },
    });

    if (existing?.checkIn?.time) {
      res.status(400);
      throw new Error("You have already checked in today");
    }

    let record;

    if (existing) {
      existing.checkIn = {
        time: new Date(),
        method: "face",
        location: { lat, lng },
      };

      existing.location = { lat, lng };
      existing.faceVerified = true;
      existing.status = "present";
      existing.approvalStatus = "pending";
      existing.rejectionReason = "";
      existing.checkOut = undefined;
      existing.workingHours = undefined;

      record = await existing.save();
    } else {
      record = await Attendance.create({
        user: req.user._id,
        userType: req.user.role === "faculty" ? "faculty" : "student",
        date: new Date(),
        location: { lat, lng },
        faceVerified: true,
        status: "present",
        approvalStatus: "pending",

        checkIn: {
          time: new Date(),
          method: "face",
          location: { lat, lng },
        },
      });
    }

    res.json({
      success: true,
      message: "Face verified & checked in. Awaiting admin approval.",
      data: record,
    });
  })
);

/* ═════════ CHECK OUT ═════════ */

router.post(
  "/checkout",
  protect,
  asyncHandler(async (req, res) => {
    const { image } = req.body;

    if (!image) {
      res.status(400);
      throw new Error("Face image required");
    }

    const { start, end } = todayRange();

    const record = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lt: end },
    });

    if (!record) {
      res.status(404);
      throw new Error("Attendance record not found");
    }

    if (!record?.checkIn?.time) {
      res.status(400);
      throw new Error("You must check in first");
    }

    if (record?.checkOut?.time) {
      res.status(400);
      throw new Error("Already checked out");
    }

    const user = await User.findById(req.user._id);

    if (!user?.profilePicture) {
      res.status(400);
      throw new Error("Profile picture missing");
    }

    const match = await verifyFace(image, user.profilePicture);

    if (!match) {
      res.status(400);
      throw new Error("Face verification failed");
    }

    record.checkOut = {
      time: new Date(),
      method: "face",
      location: record.location,
    };

    const diffMs =
      new Date(record.checkOut.time) -
      new Date(record.checkIn.time);

    record.workingHours = Number(
      (diffMs / (1000 * 60 * 60)).toFixed(2)
    );

    await record.save();

    res.json({
      success: true,
      message: "Checked out successfully",
      data: record,
    });
  })
);

/* ═════════ TODAY STATUS ═════════ */

router.get(
  "/my-status",
  protect,
  asyncHandler(async (req, res) => {
    const { start, end } = todayRange();

    const record = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lt: end },
    }).populate("user", "name email role");

    res.json({
      success: true,
      data: record || null,
    });
  })
);

/* ═════════ ADMIN: PENDING APPROVALS ═════════ */

router.get(
  "/pending-approvals",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const records = await Attendance.find({
      approvalStatus: "pending",
    })
      .populate(
        "user",
        "name email rollNumber employeeId role profilePicture"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: records,
    });
  })
);

/* ═════════ ADMIN: APPROVE / REJECT ═════════ */

router.patch(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { action, reason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      res.status(400);
      throw new Error("Invalid action");
    }

    const record = await Attendance.findById(req.params.id);

    if (!record) {
      res.status(404);
      throw new Error("Attendance record not found");
    }

    if (action === "approve") {
      record.approvalStatus = "approved";
      record.status = "present";
      record.rejectionReason = "";
    } else {
      record.approvalStatus = "rejected";
      record.status = "absent";
      record.rejectionReason =
        reason || "Rejected by admin";
    }

    record.approvedBy = req.user._id;
    record.approvedAt = new Date();

    await record.save();

    res.json({
      success: true,
      message: `Attendance ${action}d`,
      data: record,
    });
  })
);

/* ═════════ ADMIN: BULK APPROVE ═════════ */

router.post(
  "/bulk-approve",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const result = await Attendance.updateMany(
      { approvalStatus: "pending" },
      {
        $set: {
          approvalStatus: "approved",
          status: "present",
          approvedBy: req.user._id,
          approvedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} records approved`,
    });
  })
);

/* ═════════ ATTENDANCE LIST ═════════ */

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      userId,
      from,
      to,
      status,
      approvalStatus,
    } = req.query;

    const filter = {};

    if (req.user.role === "student") {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    if (status) filter.status = status;
    if (approvalStatus)
      filter.approvalStatus = approvalStatus;

    if (from || to) {
      filter.date = {};

      if (from) filter.date.$gte = new Date(from);

      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }

    const records = await Attendance.find(filter)
      .populate("user", "name email role")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .limit(500);

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  })
);

export default router;