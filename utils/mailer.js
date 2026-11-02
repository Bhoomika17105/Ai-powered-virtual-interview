import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (toEmail, otp, type = "reset") => {
  const isReset = type === "reset";

  const subject = isReset ? "Password Reset OTP" : "Email Verification OTP";
  const heading = isReset ? "Reset Your Password" : "Verify Your Email";
  const body = isReset
    ? "You requested a password reset. Use the OTP below to reset your password."
    : "Use the OTP below to verify your email address.";

  const mailOptions = {
    from: `"Auth System" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #111;">${heading}</h2>
        <p style="color: #555;">${body}</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #111; margin: 24px 0; text-align: center;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 13px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
