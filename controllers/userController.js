const users = require("../models/userModel");
const statusCode = require("../utils/statusCodes");

const loadCustomer = async (req, res) => {
  const statusFilter = req.query.status;
  const searchQuery = req.query.search || "";
  let pageNumber = parseInt(req.query.page) || 1;

  const perPageData = 5;

  try {
    let query = {};

    if (searchQuery) {
      query.$or = [
        { fname: { $regex: searchQuery, $options: "i" } },
        { lname: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phone" },
              regex: searchQuery,
              options: "i",
            },
          },
        },
      ];
    }

    if (statusFilter === "Active") {
      query.isBlocked = false;
    } else if (statusFilter === "Disabled") {
      query.isBlocked = true;
    }

    const skip = (pageNumber - 1) * perPageData;

    const [totalUsers, userData] = await Promise.all([
      users.countDocuments(query),
      users
        .find(query)
        .skip(skip)
        .limit(perPageData)
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalUsers / perPageData));
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));

    return res.status(statusCode.OK).render("admin/customerList", {
      userData: userData,
      totalPages: totalPages,
      currentPage: pageNumber,
      statusFilter: statusFilter,
      search: searchQuery,
    });
  } catch (error) {
    console.log("Error while loading the customers:", error.message);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).render("admin/500");
  }
};

const blockOrUnblockCustomer = async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await users.findById(userId);

    if (!user) {
      return res.status(statusCode.NOT_FOUND).render("user/404");
    }
    if (user.isBlocked) {
      const updatedUser = await users.findByIdAndUpdate(
        { _id: userId },
        { $set: { isBlocked: false } },
        { new: true }
      );
     
      return res.status(statusCode.OK).json({
        success: true,
        message: "user successfully unblocked",
        userId: updatedUser,
      });
    } else {
      const updatedUser = await users.findByIdAndUpdate(
        { _id: userId },
        { $set: { isBlocked: true } },
        { new: true }
      );
      
      return res.status(statusCode.OK).json({
        success: true,
        message: "user successfully blocked",
        userId: updatedUser,
      });
    }
  } catch (error) {
    console.log(
      `error while blocking or unblocking the customer`,
      error.message
    );

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error while blocking or unblocking the customer",
    });
  }
};

module.exports = {
  loadCustomer,
  blockOrUnblockCustomer,
};
