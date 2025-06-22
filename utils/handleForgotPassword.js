const crypto = require("crypto");
const { sendEmail } = require("./emailService");
require("dotenv").config();

const secureToken = async (token) => {
  try {
    return crypto.createHash("sha256").update(token).digest("hex");
  } catch (error) {
    console.log(`Error hashing the token:`, error.message);
    throw new Error("Token hashing failed");
  }
};

const sendToEmailResetPassword = async (email, token) => {
  const productionUrl = `${process.env.PRODUCTION_URL}`;
  const resetURL = `${productionUrl}/resetPassword?token=${token}`;

  const subject = "Password Reset";
  const text =
    `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
    `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
    `${resetURL}\n\n` +
    `If you did not request this, please ignore this email and your password will remain unchanged.`;

  await sendEmail(email, subject, text);
};

const RandomTokenGen = async () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateSignature = async (text, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");
};

module.exports = {
  sendToEmailResetPassword,
  secureToken,
  RandomTokenGen,
  generateSignature,
};
