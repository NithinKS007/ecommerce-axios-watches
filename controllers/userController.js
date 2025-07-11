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

    switch (statusFilter) {
      case "Active":
        query.isBlocked = false;
        break;
      case "Disabled":
        query.isBlocked = true;
        break;
      default:
        console.log(`Unknown statusFilter value: ${statusFilter}`);
        break;
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
  const { id: userId } = req.params;
  try {
    const user = await users.findById(userId);

    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const isBlocked = user.isBlocked;
    const newStatus = !isBlocked;
    const statusText = newStatus ? "blocked" : "unblocked"; 

    const updatedUser = await users.findByIdAndUpdate(
      userId,
      { $set: { isBlocked: newStatus } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Failed to update user",
      });
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: `User successfully ${statusText}`,
      userData: updatedUser,
    });
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
