/* ═══════════════════════════════════════════════════════════
   Resend HTTP API — works on Render free tier (bypasses SMTP block)
   ═══════════════════════════════════════════════════════════ */

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing in environment");
  }

  console.log(`📧 Sending email → ${to} | Subject: ${subject}`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "College ERP <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Resend API error (${response.status}):`, errorText);
    throw new Error(`Email send failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Email sent → ID: ${data.id}`);
  return data;
};

/* ═══════════════════════════════════════════════════════════
   Attendance alert helper
   ═══════════════════════════════════════════════════════════ */

export const sendAttendanceAlert = async (email, name, pct, subject) => {
  await sendEmail({
    to: email,
    subject: `Low Attendance Alert - ${subject}`,
    html: `<div style="font-family:Arial;padding:20px;background:#fff3cd;border-radius:8px"><h2 style="color:#856404">Attendance Warning</h2><p>Dear <strong>${name}</strong>,</p><p>Your attendance in <strong>${subject}</strong> has dropped to <strong style="color:red">${pct}%</strong>. Minimum required is 75%.</p></div>`,
  });
};