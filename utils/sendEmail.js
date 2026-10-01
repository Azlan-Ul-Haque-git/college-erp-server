import nodemailer from "nodemailer";

// ═══════════════════════════════════════════════════════════
//  Resend SMTP — HTTPS-based, works on Render free tier
// ═══════════════════════════════════════════════════════════

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 25000,
});

// Verify connection at startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP verify failed:", err.message);
    console.error("   RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length);
  } else {
    console.log("✅ Email server ready (Resend)");
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing");
  }

  console.log(`📧 Sending email → ${to}`);

  const info = await transporter.sendMail({
    from: "College ERP <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent → ${info.messageId}`);
  return info;
};

export const sendAttendanceAlert = async (email, name, pct, subject) => {
  await sendEmail({
    to: email,
    subject: `Low Attendance Alert - ${subject}`,
    html: `<div style="font-family:Arial;padding:20px;background:#fff3cd;border-radius:8px"><h2 style="color:#856404">Attendance Warning</h2><p>Dear <strong>${name}</strong>,</p><p>Your attendance in <strong>${subject}</strong> has dropped to <strong style="color:red">${pct}%</strong>. Minimum required is 75%.</p></div>`,
  });
};