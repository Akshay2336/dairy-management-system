const Customer = require("../models/Customer");
const MilkEntry = require("../models/MilkEntry");
const Bill = require("../models/Bill");

const getDashboard = async (req, res) => {
  try {
    // Total Customers
    const totalCustomers = await Customer.countDocuments({
      userId: req.user._id,
    });

    // Today's Date Range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's Milk Collection
    const todayMilk = await MilkEntry.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalMilk",
          },
        },
      },
    ]);

    // Total Milk Entries
    const totalEntries = await MilkEntry.countDocuments({
      userId: req.user._id,
    });

    // Total Milk Collected
    const totalMilk = await MilkEntry.aggregate([
      {
        $match: {
          userId: req.user._id,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalMilk",
          },
        },
      },
    ]);

    // Pending Bills
    const pendingBills = await Bill.countDocuments({
      userId: req.user._id,
      paymentStatus: "Pending",
    });

    // Paid Bills
    const paidBills = await Bill.countDocuments({
      userId: req.user._id,
      paymentStatus: "Paid",
    });

    // Total Revenue
    const revenue = await Bill.aggregate([
      {
        $match: {
          userId: req.user._id,
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    res.status(200).json({
      totalCustomers,
      todayMilk: todayMilk[0]?.total || 0,
      totalEntries,
      totalMilk: totalMilk[0]?.total || 0,
      pendingBills,
      paidBills,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  getDashboard,
};