const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.log(`error in hashing the password`, error.message);
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.log(`error in comparing the password`, error.message);
  }
};

module.exports = { securePassword, comparePassword };
