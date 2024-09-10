const users = require('../models/userModel')
const userAddress = require('../models/addressModel')

const loadAddress = async (req, res) => {
    const currentUser = req?.currentUser;

    const addressDetails = await userAddress
        .find({ userId: currentUser?._id })
        .sort({ createdAt: -1 });

    try {
        return res.status(200).render("user/address", { addressDetails });
    } catch (error) {
        console.log(`error while loading the address page`, error.message);

        return res.status(500).render("user/500");
    }
};

const loadAddAddress = async (req, res) => {
    try {
        return res.status(200).render("user/addAddress");
    } catch (error) {
        console.log(`error while loading the address adding page`, error.message);

        return res.status(500).render("user/500");
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
    } = req.body;

    const currentUser = req?.currentUser;
    try {
        const newAddress = await new userAddress({
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
            const sourcePage = req.body.sourcePage;
            if (sourcePage === "checkout") {
                return res.redirect("/checkout");
            } else {
                return res.redirect("/address");
            }
        }
    } catch (error) {
        console.log(`error while adding the address`, error.message);

        return res.status(500).render("user/500");
    }
};

const editAddress = async (req, res) => {

    const { id , updatedAddress } = req.body;

    if (!updatedAddress || !id) {
        return res
            .status(400)
            .json({ success: false, message: "Address details are required" });
    }
    try {
        const address = await userAddress.findById(id);

        if (!address) {
            return res
                .status(404)
                .json({ success: false, message: "address not found" });
        }

        const updatedUserAddress = await userAddress.findByIdAndUpdate(
            id,
            { $set: updatedAddress },
            { new: true }
        );

        return res
            .status(200)
            .json({
                message: "Address edited successfully",
                success: true,
                updatedUserAddress: updatedUserAddress,
            });
    } catch (error) {
        console.log(`error while editing the address`, error.message);

        return res
            .status(500)
            .json({ message: "Error while editing the address", success: false });
    }
};

const removeAddress = async (req, res) => {
    try {
        const { addressId } = req.body;

        const currentUser = req?.currentUser;

        const deletedAddressFromCollection = await userAddress.deleteOne({
            userId: currentUser?._id,
            _id: addressId,
        });

        const isAddressEmpty = await userAddress.countDocuments({
            userId: currentUser?._id,
        });

        if (deletedAddressFromCollection) {
            return res.status(200).json({
                success: true,
                message: "Item deleted from the address collection successfully",
                isAddressEmpty: isAddressEmpty,
                deletedAddressFromCollection: deletedAddressFromCollection,
            });
        } else {
            return res.status(500).json({
                success: false,
                message:
                    "Something went wrong while deleting item from the address collection",
            });
        }
    } catch (error) {
        console.log(`error while deleting the address`, error.message);

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while deleting item from the address collection",
        });
    }
};

module.exports = {
    loadAddress,
    loadAddAddress,
    addAddress,
    removeAddress,
    editAddress,
};
