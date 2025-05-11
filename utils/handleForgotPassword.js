const crypto = require("crypto");
const { sendEmail } = require("./emailService");

const secureToken = async (token) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    return tokenHash;
  } catch (error) {
    console.log(`Error hashing the token:`, error.message);
    throw new Error("Token hashing failed");
  }
};

const sendToEmailResetPassword = async (email, token) => {
  const productionUrl = `http://localhost:7000`;
  const resetURL = `${productionUrl}/resetPassword?token=${token}`;

  console.log(resetURL);

  const subject = "Password Reset";
  const text =
    `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
    `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
    `${resetURL}\n\n` +
    `If you did not request this, please ignore this email and your password will remain unchanged.`;

  await sendEmail(email, subject, text);
};

module.exports = {
  sendToEmailResetPassword,
  secureToken,
};
