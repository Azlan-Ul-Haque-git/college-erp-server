import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { Fees } from "../models/Fees.js";
import { Student } from "../models/Student.js";
import asyncHandler from "express-async-handler";
import crypto from "crypto";

const router = express.Router();

router.post("/create-order", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, message: "Razorpay not configured" });
  }

  const { default: Razorpay } = await import("razorpay");
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  res.json({ success: true, order });
}));

router.post("/verify", protect, authorizeRoles("student"), asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (sign !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification failed");
  }

  const student = await Student.findOne({ user: req.user._id });
  const fee = await Fees.findOne({
    student: student?._id,
    status: { $ne: "Paid" },
  }).sort({ createdAt: -1 });

  if (fee) {
    fee.paidAmount += fee.dueAmount;
    fee.transactions.push({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: fee.dueAmount,
      status: "success",
    });
    await fee.save();
  }

  res.json({ success: true, message: "Payment successful!" });
}));

export default router;