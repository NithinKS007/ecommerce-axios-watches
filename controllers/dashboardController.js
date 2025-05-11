const dayjs = require("dayjs");
const products = require("../models/productModel");
const orders = require("../models/orderModel");

const loadDashboard = async (req, res) => {
  try {
    const startOfMonth = dayjs().startOf("month").toDate();

    const today = dayjs().endOf("day").toDate();

    const successMessage = req.session.successMessage;

    req.session.successMessage = null;

    const [
      totalSalesC,
      totalOrders,
      { totalProducts, totalCategories },
      monthlyRev,
      totalRev,
      overallSalesTotalAmount,
      overAllDiscountAmount,
      tableSalesData,
    ] = await Promise.all([
      totalSalesCount(),
      countTotalOrders(),
      aggregateProductByCategory(),
      monthlyAvg(),
      totalRevenue(),
      overAllOrderAmount(),
      overAllDiscount(),
      calculateSalesData(startOfMonth, today),
    ]);

    const [{ date } = {}] = tableSalesData;

    let tableTotalNumberOfOrders = 0;
    let tableTotalGrossSales = 0;
    let tableTotalCouponDeductions = 0;
    let tableTotalNetSales = 0;

    tableSalesData.forEach((sale) => {
      tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
      tableTotalGrossSales += sale.grossSales || 0;
      tableTotalCouponDeductions += sale.couponDeductions || 0;
      tableTotalNetSales += sale.netSales || 0;
    });

    return res.status(200).render("admin/dashboard", {
      successMessage,
      totalOrders,
      totalProducts,
      totalCategories,
      monthlyRev,
      startOfMonth: startOfMonth,

      today: today,
      totalRev,
      totalSalesC,
      overallSalesTotalAmount,
      overAllDiscountAmount,
      tableTotalNumberOfOrders,
      tableTotalGrossSales,
      tableTotalCouponDeductions,
      tableTotalNetSales,
      tableSalesData,
      date,
    });
  } catch (error) {
    console.log(
      `error while loading the dashboard of the admin`,
      error.message
    );

    return res.status(500).render("admin/500");
  }
};

const overAllDiscount = async () => {
  try {
    const orderList = await orders.find({});

    let subTotalAmountWithOutAnyOffer = 0;
    let totalAmountWithAllOfferApplied = 0;

    orderList.forEach((order) => {
      order.items.forEach((item) => {
        const itemPrice =
          item.productSalesPriceAfterOfferDiscount > 0
            ? item.productSalesPriceAfterOfferDiscount
            : item.price;
        subTotalAmountWithOutAnyOffer += itemPrice * item.quantity;
      });
    });

    orderList.forEach((order) => {
      totalAmountWithAllOfferApplied += order.totalAmount;
    });

    const totalDiscountAmount =
      subTotalAmountWithOutAnyOffer - totalAmountWithAllOfferApplied;
    return totalDiscountAmount.toFixed(2);
  } catch (error) {
    console.log(`Error while calculating the discount: ${error.message}`);
    return res.status(500).render("admin/500");
  }
};

const overAllOrderAmount = async () => {
  try {
    const ordersList = await orders.find({}, { totalAmount: 1 });

    const totalSalesAmount = ordersList.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );

    return totalSalesAmount;
  } catch (error) {
    console.log(
      `error while calculating the overall sales amount`,
      error.message
    );

    return res.status(500).render("admin/500");
  }
};

const totalSalesCount = async () => {
  try {
    return await orders.countDocuments();
  } catch (error) {
    console.log(`error while calculating the sales count`, error.message);

    return res.status(500).render("admin/500");
  }
};

const countTotalOrders = async () => {
  try {
    return await orders.countDocuments();
  } catch (error) {
    console.log(`error while getting the total orders`, error.message);

    return res.status(500).render("admin/500");
  }
};
const aggregateProductByCategory = async () => {
  try {
    const productByCategory = await products.aggregate([
      { $match: { stock: { $gt: 0 } } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.name",
          productCount: { $sum: 1 },
        },
      },
    ]);
    const totalProducts = productByCategory.reduce(
      (sum, category) => sum + category.productCount,
      0
    );

    const totalCategories = productByCategory.length;

    return { totalProducts, totalCategories };
  } catch (error) {
    console.log(`error while getting the total products`, error.message);

    return res.status(500).render("admin/500");
  }
};

const monthlyAvg = async () => {
  try {
    const startOfMonth = dayjs().startOf("month").toDate();

    const today = dayjs().endOf("day").toDate();

    const ordersThisMonth = await orders.find({
      orderDate: { $gte: startOfMonth, $lte: today },
    });

    let MonthlyRevUntilNow = 0;

    ordersThisMonth.forEach((order) => {
      order.items.forEach((item) => {
        if (item.orderProductStatus === "delivered") {
          const itemPrice =
            item.productSalesPriceAfterOfferDiscount > 0
              ? item.productSalesPriceAfterOfferDiscount
              : item.price;

          const itemTotalAmount = itemPrice * item.quantity;

          const itemProportion = itemTotalAmount / order.subTotalAmount;

          const itemDiscount = itemProportion * order.discountAmount;

          const priceAfterEverything = itemTotalAmount - itemDiscount;

          MonthlyRevUntilNow += priceAfterEverything;
        }
      });
    });

    return MonthlyRevUntilNow.toFixed(2);
  } catch (error) {
    console.log(`error while getting the monthly average`, error.message);

    return res.status(500).render("admin/500");
  }
};

const totalRevenue = async () => {
  try {
    const allOrders = await orders.find({});

    let totalRev = 0;

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.orderProductStatus === "delivered") {
          const itemPrice =
            item.productSalesPriceAfterOfferDiscount > 0
              ? item.productSalesPriceAfterOfferDiscount
              : item.price;

          const itemTotalAmount = itemPrice * item.quantity;

          const itemProportion = itemTotalAmount / order.subTotalAmount;

          const itemDiscount = itemProportion * order.discountAmount;

          const priceAfterEverything = itemTotalAmount - itemDiscount;

          totalRev += priceAfterEverything;
        }
      });
    });

    return totalRev.toFixed(2);
  } catch (error) {
    console.log(`error while calculating the total revenue`, error.message);

    return res.status(500).render("admin/500");
  }
};

const fetchSalesReport = async (req, res) => {
  try {
    const { dateFrom, dateTill, period } = req.query;

    let tableTotalNumberOfOrders = 0;
    let tableTotalGrossSales = 0;
    let tableTotalCouponDeductions = 0;
    let tableTotalNetSales = 0;

    if (dateFrom && dateTill) {
      startDate = dayjs(dateFrom).startOf("day").toDate();
      endDate = dayjs(dateTill).endOf("day").toDate();

      const salesData = await calculateSalesData(startDate, endDate);

      salesData.forEach((sale) => {
        tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
        tableTotalGrossSales += sale.grossSales || 0;
        tableTotalCouponDeductions += sale.couponDeductions || 0;
        tableTotalNetSales += sale.netSales || 0;
      });
      return res
        .status(200)
        .json({
          message: "sales data for the the given dates",
          salesData,
          tableTotalNumberOfOrders,
          tableTotalGrossSales,
          tableTotalCouponDeductions,
          tableTotalNetSales,
        });
    } else {
      switch (period) {
        case "today":
          startDate = dayjs().startOf("day").toDate();
          endDate = dayjs().endOf("day").toDate();
          break;
        case "week":
          startDate = dayjs().startOf("week").toDate();
          endDate = dayjs().endOf("week").toDate();
          break;
        case "month":
          startDate = dayjs().startOf("month").toDate();
          endDate = dayjs().endOf("month").toDate();
          break;
        default:
          throw new Error("Invalid period specified");
      }

      const salesData = await calculateSalesData(startDate, endDate);

      salesData.forEach((sale) => {
        tableTotalNumberOfOrders += sale.totalNumberOfOrders || 0;
        tableTotalGrossSales += sale.grossSales || 0;
        tableTotalCouponDeductions += sale.couponDeductions || 0;
        tableTotalNetSales += sale.netSales || 0;
      });

      return res
        .status(200)
        .json({
          message: "sales data for the the given period of time",
          salesData,
          tableTotalNumberOfOrders,
          tableTotalGrossSales,
          tableTotalCouponDeductions,
          tableTotalNetSales,
        });
    }
  } catch (error) {
    console.error("Error while fetching sales data:", error.message);

    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while fetching sales data.",
      });
  }
};

const calculateSalesData = async (startDate, endDate) => {
  try {
    const matchStage = { $match: { "items.orderProductStatus": "delivered" } };
    if (startDate && endDate) {
      matchStage.$match.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    const pipeline = [
      matchStage,
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.orderProductStatus": "delivered",
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%d-%b-%Y", date: "$orderDate" } },
          },
          totalNumberOfOrders: { $sum: 1 },
          grossSales: {
            $sum: {
              $multiply: [
                {
                  $cond: [
                    { $gt: ["$items.productSalesPriceAfterOfferDiscount", 0] },
                    "$items.productSalesPriceAfterOfferDiscount",
                    "$items.price",
                  ],
                },
                "$items.quantity",
              ],
            },
          },
          couponDeductions: {
            $sum: {
              $multiply: [
                {
                  $divide: [
                    {
                      $multiply: [
                        {
                          $cond: [
                            {
                              $gt: [
                                "$items.productSalesPriceAfterOfferDiscount",
                                0,
                              ],
                            },
                            "$items.productSalesPriceAfterOfferDiscount",
                            "$items.price",
                          ],
                        },
                        "$items.quantity",
                      ],
                    },
                    "$subTotalAmount",
                  ],
                },
                "$discountAmount",
              ],
            },
          },
        },
      },
      {
        $project: {
          date: "$_id.date",
          totalNumberOfOrders: 1,
          grossSales: 1,
          couponDeductions: 1,
          netSales: { $subtract: ["$grossSales", "$couponDeductions"] },
        },
      },
    ];
    const salesData = await orders.aggregate(pipeline).exec();
    return salesData;
  } catch (error) {
    console.log(`error while calculating the sales report`, error.message);
    return res.status(500).render("admin/500");
  }
};

module.exports = {
  loadDashboard,
  calculateSalesData,
  fetchSalesReport,
};
