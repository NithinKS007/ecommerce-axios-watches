const users = require("../models/userModel");
const userAddress = require("../models/addressModel");
const statusCode = require("../utils/statusCodes");
const statusCodes = require("../utils/statusCodes");

const loadAddress = async (req, res) => {
  try {
    let pageNumber = parseInt(req.query.page) || 1;
    const perPageData = 2;
    const skip = (pageNumber - 1) * perPageData;

    const currentUser = req?.currentUser;
    const [totalAddressCount, addressDetails] = await Promise.all([
      userAddress.countDocuments({ userId: currentUser?._id }),
      userAddress
        .find({ userId: currentUser?._id })
        .skip(skip)
        .limit(perPageData)
        .sort({ createdAt: -1 }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalAddressCount / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    return res.status(statusCode.OK).render("user/address", {
      addressDetails,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log(`error while loading the address page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const loadAddAddress = async (req, res) => {
  try {
    return res.status(statusCode.OK).render("user/addAddress");
  } catch (error) {
    console.log(`error while loading the address page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const { addressId } = req.query;

    const addressData = await userAddress.findById(addressId)

    if(!addressData){
       return res.status(statusCode.BAD_REQUEST).render("user/400");
    }
    return res.status(statusCode.OK).render("user/editAddress",{addressData});
  } catch (error) {
    console.log(`error while loading the address page`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const addAddress = async (req, res) => {
  const {
    name,
    phone,
    pincode,
    locality,
    address,
    cityDistTown,
    state,
    landMark,
    altPhone,
    email,
    addressType,
  } = req.body.address;

  const currentUser = req?.currentUser;
  try {
    const newAddress = new userAddress({
      name: name,
      userId: currentUser?._id,
      phone: phone,
      pincode: pincode,
      locality: locality,
      address: address,
      cityDistTown: cityDistTown,
      state: state,
      landMark: landMark,
      altPhone: altPhone,
      email: email,
      addressType: addressType,
    });

    const addressData = await newAddress.save();

    const pushAddressIntoUser = await users.findByIdAndUpdate(
      { _id: currentUser?._id },
      { $push: { addressId: addressData?._id } },
      { new: true }
    );

    if (addressData && pushAddressIntoUser) {
      return res.status(statusCodes.CREATED).json({
        success: true,
        message: "Address added successfully",
      });
    }
  } catch (error) {
    console.log(`error while adding the address`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("user/500");
  }
};

const editAddress = async (req, res) => {
  const { id } = req.params;
  const { updatedAddress } = req.body;

  console.log("add",req.body,id)
  if (!updatedAddress || !id) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ success: false, message: "Address details are required" });
  }
  try {
    const address = await userAddress.findById(id);

    if (!address) {
      return res
        .status(statusCode.NOT_FOUND)
        .json({ success: false, message: "address not found" });
    }

    const updatedUserAddress = await userAddress.findByIdAndUpdate(
      id,
      { $set: updatedAddress },
      { new: true }
    );

    return res.status(statusCode.OK).json({
      message: "Address edited successfully",
      success: true,
      updatedUserAddress: updatedUserAddress,
    });
  } catch (error) {
    console.log(`error while editing the address`, error.message);

    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: "Error while editing the address", success: false });
  }
};

const removeAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUser = req?.currentUser;

    const deletedAddress = await userAddress.deleteOne({
      userId: currentUser?._id,
      _id: id,
    });

    if (deletedAddress) {
      return res.status(statusCode.OK).json({
        success: true,
        message: "Address deleted successfully",
      });
    }
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while editing address",
    });
  } catch (error) {
    console.log(`error while deleting the address`, error.message);

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while editing address",
    });
  }
};

module.exports = {
  loadAddress,
  addAddress,
  removeAddress,
  editAddress,
  loadAddAddress,
  loadEditAddress,
};
