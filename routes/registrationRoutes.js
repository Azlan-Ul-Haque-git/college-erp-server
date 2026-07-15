import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";

const router = express.Router();


// =========================
// Public — Submit Registration
// =========================

router.post("/", asyncHandler(async (req, res) => {

  const { email } = req.body;

  const exists = await Registration.findOne({ email });

  if (exists) {
    res.status(400);
    throw new Error("Registration request already submitted for this email");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const registration = await Registration.create({

    ...req.body,

    studentStatus:
      req.body.studentStatus ||
      req.body.status ||
      "regular",

    status: "Pending",

  });

  res.status(201).json({
    success: true,
    message: "Registration request submitted! Admin will review it.",
    registration,
  });

}));


// =========================
// Admin — Get Registrations
// =========================

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {

    const registrations = await Registration.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      registrations,
    });

  })
);


// =========================
// Admin — Approve Registration
// =========================

router.put(
  "/:id/approve",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {

    console.log("========== APPROVE START ==========");

    const reg = await Registration.findById(req.params.id);

    console.log("REGISTRATION FOUND:");
    console.log(reg);

    if (!reg) {
      res.status(404);
      throw new Error("Registration not found");
    }

    const existingUser = await User.findOne({
      email: reg.email,
    });

    if (existingUser) {
      res.status(400);
      throw new Error("User already exists");
    }

    // IMPORTANT:
    // User model already hashes password using pre("save")
    // Therefore DO NOT hash here.

    const user = await User.create({

      name: reg.name,
      email: reg.email,
      password: reg.password,
      role: reg.role,
      phone: reg.phone,

    });

    console.log("USER CREATED:");
    console.log(user);

    if (reg.role === "student") {

      const student = await Student.create({

        user: user._id,

        rollNo: reg.rollNo || `STU${Date.now()}`,

        branch: reg.branch || "CSE",

        semester: reg.semester || 1,

        year: reg.year || 1,

        section: reg.section || "A",

        status: reg.studentStatus || "regular",

        backlogCount: reg.backlogCount || 0,

      });

      console.log("STUDENT CREATED:");
      console.log(student);

    }

    else if (reg.role === "faculty") {

      const faculty = await Faculty.create({

        user: user._id,

        department: reg.department || "CSE",

        designation: reg.designation || "Lecturer",

        employeeId: `FAC${Date.now()}`,

      });

      console.log("FACULTY CREATED:");
      console.log(faculty);

    }

    reg.status = "Approved";

    await reg.save();

    console.log("========== APPROVE END ==========");

    res.json({
      success: true,
      message: "Registration approved! User can now login.",
    });

  })
);


// =========================
// Reject Registration
// =========================

router.put(
  "/:id/reject",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {

    await Registration.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        adminRemarks: req.body.remarks || "",
      }
    );

    res.json({
      success: true,
      message: "Registration rejected.",
    });

  })
);


// =========================
// Delete Registration
// =========================

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {

    await Registration.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });

  })
);

export default router;