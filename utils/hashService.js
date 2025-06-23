const crypto = require("crypto");
require("dotenv").config();

const secureToken = async (token) => {
  try {
    return crypto.createHash("sha256").update(token).digest("hex");
  } catch (error) {
    console.log(`Error hashing the token:`, error.message);
    throw new Error("Token hashing failed");
  }
};

const RandomTokenGen = async () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateSignature = async (text, secret) => {
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
};

module.exports = {
  secureToken,
  RandomTokenGen,
  generateSignature,
};
