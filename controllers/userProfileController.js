const users = require("../models/userModel");
const statusCode = require("../utils/statusCodes");
const { securePassword } = require("./userAuthController");
const { comparePassword } = require("../utils/encryptionService");

const loadUserProfile = async (req, res) => {
  try {
    const currentUser = req.currentUser;

    const userData = await users.findById(currentUser?._id);

    if (!userData) {
      return res.status(statusCode.NOT_FOUND).render("user/404");
    }

    return res.status(statusCode.OK).render("user/profile", { userData: userData });
  } catch (error) {
    console.log(`error while loading user profile`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const editProfile = async (req, res) => {
  try {
    const { id, updatedUserDetails } = req.body;

    const userData = await users.findById(id);

    if (!userData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ message: "User not found", success: false });
    }

    const { firstName, lastName, phone } = updatedUserDetails;

    const updatedData = {
      fname: firstName,
      lname: lastName,
      phone: phone,
    };

    await users.findByIdAndUpdate(
      userData._id,
      { $set: updatedData },
      { new: true }
    );

    return res
      .status(statusCode.OK)
      .json({ message: "Your profile edited successfully", success: true });
  } catch (error) {
    console.log(`Error while editing the user profile:`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({
        message: "An error occurred while editing your profile",
        success: false,
      });
  }
};

const editPassword = async (req, res) => {
  const { updatedPasswordDetails } = req.body;

  const currentUser = req.currentUser;

  try {
    const userData = await users.findOne({
      _id: currentUser._id,
      isBlocked: false,
    });

    if (!userData) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ message: "User not found", success: false });
    }

    const passwordMatch = comparePassword(
      updatedPasswordDetails.existingPassword,
      userData.password
    );

    if (!passwordMatch) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .json({
          message: "Incorrect Current Password",
          success: false,
          incorrectPassword: true,
        });
    }

    const hashedNewPassword = await securePassword(
      updatedPasswordDetails.newPassword
    );

    const updatedPassword = await users.updateOne(
      { _id: currentUser._id },
      { $set: { password: hashedNewPassword } }
    );

    if (updatedPassword && hashedNewPassword) {
      return res
        .status(statusCode.OK)
        .json({
          message: "Your password updated successfully",
          success: true,
          incorrectPassword: false,
        });
    }
  } catch (error) {
    console.log(`Error while editing the password`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Error while updating the passoword", success: false });
  }
};

module.exports = {
  loadUserProfile,
  editProfile,
  editPassword,
};
