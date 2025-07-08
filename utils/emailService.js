const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendToEmailResetPassword = async (email, token) => {
  const productionUrl = `${process.env.PRODUCTION_URL}`;
  const resetURL = `${productionUrl}/reset-password?token=${token}`;

  const subject = "Password Reset";
  const text =
    `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
    `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
    `${resetURL}\n\n` +
    `If you did not request this, please ignore this email and your password will remain unchanged.`;

  await sendEmail(email, subject, text);
};

const sendEmail = async (email, subject, text) => {
  try {
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: subject,
      text: text,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending the email:", error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendEmail,
  sendToEmailResetPassword,
};
