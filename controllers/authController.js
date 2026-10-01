import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import { generateToken, generateOTP } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";

/* ═══════════════════════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════════════════════ */

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    status,
    backlogCount,
    ...extra
  } = req.body;

  const exists = await User.findOne({ email });

  if (exists) {
    res.status(400);
    throw new Error("Email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
  });

  /* ───── STUDENT ───── */
  if (role === "student") {
    await User.findByIdAndUpdate(user._id, {
      rollNumber: extra.rollNumber,
      branch: extra.branch,
      year: +extra.year || 1,
      semester: +extra.semester || 1,
      section: extra.section,
      admissionNo: extra.admissionNo,
      parentName: extra.parentName,
      parentPhone: extra.parentPhone,
      status: extra.status || "regular",
      backlogCount: +extra.backlogCount || 0,
    });
  }
  /* ───── FACULTY ───── */
  else if (role === "faculty") {
    await Faculty.create({
      user: user._id,
      employeeId: extra.employeeId,
      department: extra.department,
      designation: extra.designation,
      subjects: extra.subjects || [],
      qualification: extra.qualification,
      experience: +extra.experience || 0,
    });
  }

  /* ───── WELCOME EMAIL (non-blocking) ───── */
  sendEmail({
    to: email,
    subject: "Welcome to College ERP",
    html: `
      <div style="padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;color:#fff">
        <h2>Welcome, ${name}!</h2>
        <p>Email: ${email}</p>
        <p>Role: ${role}</p>
        ${role === "student"
        ? `<p>Status: ${status || "regular"}</p>
               <p>Backlogs: ${+backlogCount || 0}</p>`
        : ""
      }
        <p>Temporary Password: ${password}</p>
      </div>
    `,
  }).catch((err) => console.log("Welcome email failed:", err.message));

  res.status(201).json({
    success: true,
    message: "User registered",
    user: {
      _id: user._id,
      name,
      email,
      role,
    },
  });
});

/* ═══════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════ */

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Account deactivated");
  }

  let profile = null;

  if (user.role === "faculty") {
    profile = await Faculty.findOne({ user: user._id });
  }

  /* ✅ FULL user object — student fields included */
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    phone: user.phone || "",

    // Student fields
    rollNumber: user.rollNumber || "",
    branch: user.branch || "",
    year: user.year || 1,
    semester: user.semester || 1,
    section: user.section || "",
    admissionNo: user.admissionNo || "",
    parentName: user.parentName || "",
    parentPhone: user.parentPhone || "",
    status: user.status || "regular",
    backlogCount: user.backlogCount || 0,

    // Faculty profile
    profile,
  };

  res.json({
    success: true,
    token: generateToken(user._id),
    user: userResponse,
  });
});

/* ═══════════════════════════════════════════════════════════
   GET ME
   ═══════════════════════════════════════════════════════════ */

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  let profile = null;

  if (user.role === "faculty") {
    profile = await Faculty.findOne({ user: user._id });
  }

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      profile,
    },
  });
});

/* ═══════════════════════════════════════════════════════════
   FORGOT PASSWORD
   ═══════════════════════════════════════════════════════════ */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No account with this email");
  }

  const otp = generateOTP();

  user.resetOTP = otp;
  user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  console.log(`🔐 OTP generated for ${email}: ${otp}`);

  try {
    await sendEmail({
      to: email,
      subject: "Password Reset OTP — College ERP",
      html: `
        <div style="padding:24px;border:2px solid #667eea;border-radius:12px;font-family:Arial,sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#667eea;margin-top:0">🔐 Password Reset OTP</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Use the OTP below to reset your password:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#764ba2;text-align:center;padding:16px;background:#f3f0ff;border-radius:8px;margin:16px 0">
            ${otp}
          </div>
          <p style="color:#666;font-size:13px">This OTP expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    console.log(`✅ OTP email successfully sent to ${email}`);

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${email}:`, err.message);

    // Roll back OTP — since we couldn't send it
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error(
      `Could not send OTP email. Reason: ${err.message}. Please contact admin.`
    );
  }
});

/* ═══════════════════════════════════════════════════════════
   RESET PASSWORD
   ═══════════════════════════════════════════════════════════ */

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetOTP: otp,
    resetOTPExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpire = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Password reset successful",
  });
});

/* ═══════════════════════════════════════════════════════════
   CHANGE PASSWORD
   ═══════════════════════════════════════════════════════════ */

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(oldPassword))) {
    res.status(401);
    throw new Error("Incorrect current password");
  }

  user.password = newPassword;

  await user.save();

  res.json({
    success: true,
    message: "Password changed",
  });
});