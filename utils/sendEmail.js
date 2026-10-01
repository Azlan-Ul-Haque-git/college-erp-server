import nodemailer from "nodemailer";

// ═══════════════════════════════════════════════════════════
//  Gmail transporter — Port 465 (SSL) is more reliable on
//  cloud hosts like Render than 587 (STARTTLS), which is
//  sometimes blocked.
// ═══════════════════════════════════════════════════════════

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,                 // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // prevents self-signed cert errors
  },
  connectionTimeout: 10000,     // 10 sec timeout — fail fast
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// ═══════════════════════════════════════════════════════════
//  Verify SMTP connection ONCE at startup
// ═══════════════════════════════════════════════════════════

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP verify failed:", err.message);
    console.error("   EMAIL_USER:", process.env.EMAIL_USER);
    console.error("   EMAIL_PASS length:", process.env.EMAIL_PASS?.length);
  } else {
    console.log("✅ SMTP server ready — emails will work");
  }
});

// ═══════════════════════════════════════════════════════════
//  Main sendEmail function — THROWS on failure
// ═══════════════════════════════════════════════════════════

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing in environment");
  }

  console.log(`📧 Sending email → ${to} | Subject: ${subject}`);

  const info = await transporter.sendMail({
    from: `"College ERP" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent → messageId: ${info.messageId}`);
  return info;
};

// ═══════════════════════════════════════════════════════════
//  Attendance alert helper (unchanged)
// ═══════════════════════════════════════════════════════════

export const sendAttendanceAlert = async (email, name, pct, subject) => {
  await sendEmail({
    to: email,
    subject: `Low Attendance Alert - ${subject}`,
    html: `<div style="font-family:Arial;padding:20px;background:#fff3cd;border-radius:8px"><h2 style="color:#856404">Attendance Warning</h2><p>Dear <strong>${name}</strong>,</p><p>Your attendance in <strong>${subject}</strong> has dropped to <strong style="color:red">${pct}%</strong>. Minimum required is 75%.</p></div>`,
  });
};