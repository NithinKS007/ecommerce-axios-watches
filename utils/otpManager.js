const otpGenerator = require("otp-generator");
const { sendEmail } = require("./emailService");

const generateOtp = async () => {
  return otpGenerator.generate(6, { upperCase: false, specialChars: false });
};

const sendOtpEmail = async (email, otp) => {
  const subject = "OTP for Registration";

  const text = `Your OTP is ${otp}. Please do not share this OTP with anyone.`;

  await sendEmail(email, subject, text);
};

module.exports = {
  generateOtp,
  sendOtpEmail,
};
