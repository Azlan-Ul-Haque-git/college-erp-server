import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"College ERP" <${process.env.EMAIL_USER}>`,
    to, subject, html
  });
};

export const sendAttendanceAlert = async (email, name, pct, subject) => {
  await sendEmail({
    to: email,
    subject: `Low Attendance Alert - ${subject}`,
    html: `<div style="font-family:Arial;padding:20px;background:#fff3cd;border-radius:8px"><h2 style="color:#856404">Attendance Warning</h2><p>Dear <strong>${name}</strong>,</p><p>Your attendance in <strong>${subject}</strong> has dropped to <strong style="color:red">${pct}%</strong>. Minimum required is 75%.</p></div>`
  });
};