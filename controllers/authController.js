import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { Faculty } from "../models/Faculty.js";
import { generateToken, generateOTP } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, ...extra } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error("Email already exists"); }
  const user = await User.create({ name, email, password, role, phone });
  if (role==="student") await Student.create({ user:user._id, rollNo:extra.rollNo, branch:extra.branch, year:+extra.year, semester:+extra.semester, section:extra.section, admissionNo:extra.admissionNo, parentName:extra.parentName, parentPhone:extra.parentPhone });
  else if (role==="faculty") await Faculty.create({ user:user._id, employeeId:extra.employeeId, department:extra.department, designation:extra.designation, subjects:extra.subjects||[], qualification:extra.qualification, experience:+extra.experience||0 });
  sendEmail({ to:email, subject:"Welcome to College ERP", html:`<div style="padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;color:#fff"><h2>Welcome, ${name}!</h2><p>Email: ${email} | Role: ${role}</p><p>Temporary Password: ${password}</p></div>` }).catch(()=>{});
  res.status(201).json({ success:true, message:"User registered", user:{ _id:user._id, name, email, role } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email||!password) { res.status(400); throw new Error("Please provide email and password"); }
  const user = await User.findOne({ email });
  if (!user||!(await user.matchPassword(password))) { res.status(401); throw new Error("Invalid email or password"); }
  if (!user.isActive) { res.status(403); throw new Error("Account deactivated"); }
  let profile = null;
  if (user.role==="student") profile = await Student.findOne({ user:user._id }).select("-faceData");
  else if (user.role==="faculty") profile = await Faculty.findOne({ user:user._id });
  res.json({ success:true, token:generateToken(user._id), user:{ _id:user._id, name:user.name, email:user.email, role:user.role, avatar:user.avatar, phone:user.phone, profile } });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  let profile = null;
  if (user.role==="student") profile = await Student.findOne({ user:user._id }).select("-faceData");
  else if (user.role==="faculty") profile = await Faculty.findOne({ user:user._id });
  res.json({ success:true, user:{ ...user.toObject(), profile } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email:req.body.email });
  if (!user) { res.status(404); throw new Error("No account with this email"); }
  const otp = generateOTP();
  user.resetOTP = otp; user.resetOTPExpire = Date.now() + 10*60*1000;
  await user.save();
  await sendEmail({ to:req.body.email, subject:"Password Reset OTP", html:`<div style="padding:24px;border:2px solid #667eea;border-radius:12px"><h2 style="color:#667eea">Reset OTP</h2><div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#764ba2;text-align:center;padding:16px;background:#f3f0ff;border-radius:8px">${otp}</div><p style="color:#666;font-size:13px">Expires in 10 minutes.</p></div>` });
  res.json({ success:true, message:"OTP sent to email" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email, resetOTP:otp, resetOTPExpire:{ $gt:Date.now() } });
  if (!user) { res.status(400); throw new Error("Invalid or expired OTP"); }
  user.password=newPassword; user.resetOTP=undefined; user.resetOTPExpire=undefined;
  await user.save();
  res.json({ success:true, message:"Password reset successful" });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(oldPassword))) { res.status(401); throw new Error("Incorrect current password"); }
  user.password=newPassword; await user.save();
  res.json({ success:true, message:"Password changed" });
});
