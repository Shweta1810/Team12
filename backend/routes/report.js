const express = require("express");

const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");
const Interaction = require("../models/Interaction");
const FollowUp = require("../models/FollowUp");
const Feedback = require("../models/Feedback");
const RetentionActivity = require("../models/RetentionActivity");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const Sale = require("../models/Sale");

const authenticateUser = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const isAdmin = role === "Admin";

    const leadFilter = isAdmin ? {} : { assignedTo: userId };
    const customerFilter = isAdmin ? {} : { assignedTo: userId };
    const staffFilter = isAdmin ? {} : { staff: userId };
    const saleFilter = isAdmin ? {} : { salesperson: userId };

    const customerIds = isAdmin
      ? []
      : await Customer.find(customerFilter).distinct("_id");

    const [
      totalLeads,
      totalCustomers,
      totalInteractions,
      totalFollowUps,
      totalFeedback,
      totalRetentionActivities,
      totalLoyaltyAccounts,
      totalSales,
      paidSales,
      pendingSales,
    ] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Customer.countDocuments(customerFilter),
      Interaction.countDocuments(staffFilter),
      FollowUp.countDocuments(staffFilter),
      Feedback.countDocuments(staffFilter),
      RetentionActivity.countDocuments(staffFilter),

      LoyaltyAccount.countDocuments(
        isAdmin
          ? {}
          : {
              customer: {
                $in: customerIds,
              },
            }
      ),

      Sale.countDocuments(saleFilter),
      Sale.countDocuments({
        ...saleFilter,
        paymentStatus: "Paid",
      }),
      Sale.countDocuments({
        ...saleFilter,
        paymentStatus: "Pending",
      }),
    ]);

    const salesSummary = await Sale.aggregate([
      { $match: saleFilter },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                "$amount",
                0,
              ],
            },
          },
          totalAmount: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const revenue = salesSummary[0] || {
      totalRevenue: 0,
      totalAmount: 0,
    };

    const saleStatusReport = await Sale.aggregate([
      { $match: saleFilter },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const salesByStatus = {
      Pending: 0,
      Paid: 0,
      Cancelled: 0,
    };

    saleStatusReport.forEach((item) => {
      if (item._id in salesByStatus) {
        salesByStatus[item._id] = item.count;
      }
    });

    const leadStatusReport = await Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const leadsByStatus = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0,
    };

    leadStatusReport.forEach((item) => {
      if (item._id in leadsByStatus) {
        leadsByStatus[item._id] = item.count;
      }
    });

    const feedbackStatusReport = await Feedback.aggregate([
      { $match: staffFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const feedbackByStatus = {
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
    };

    feedbackStatusReport.forEach((item) => {
      if (item._id in feedbackByStatus) {
        feedbackByStatus[item._id] = item.count;
      }
    });

    const followUpStatusReport = await FollowUp.aggregate([
      { $match: staffFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const followUpsByStatus = {
      Scheduled: 0,
      Completed: 0,
      Rescheduled: 0,
      Overdue: 0,
    };

    followUpStatusReport.forEach((item) => {
      if (item._id in followUpsByStatus) {
        followUpsByStatus[item._id] = item.count;
      }
    });

    const retentionStatusReport =
      await RetentionActivity.aggregate([
        { $match: staffFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

    const retentionByStatus = {
      Planned: 0,
      Completed: 0,
      Cancelled: 0,
    };

    retentionStatusReport.forEach((item) => {
      if (item._id in retentionByStatus) {
        retentionByStatus[item._id] = item.count;
      }
    });

    const loyaltyMatch = isAdmin
      ? {}
      : {
          customer: {
            $in: customerIds,
          },
        };

    const loyaltySummary =
      await LoyaltyAccount.aggregate([
        { $match: loyaltyMatch },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$points" },
            totalEarned: { $sum: "$totalEarned" },
            totalRedeemed: { $sum: "$totalRedeemed" },
          },
        },
      ]);

    const loyaltyTierReport =
      await LoyaltyAccount.aggregate([
        { $match: loyaltyMatch },
        {
          $group: {
            _id: "$tier",
            count: { $sum: 1 },
          },
        },
      ]);

    const loyaltyByTier = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };

    loyaltyTierReport.forEach((item) => {
      if (item._id in loyaltyByTier) {
        loyaltyByTier[item._id] = item.count;
      }
    });

    const loyaltyTotals = loyaltySummary[0] || {
      totalPoints: 0,
      totalEarned: 0,
      totalRedeemed: 0,
    };

    res.json({
      message: "Reports generated successfully.",

      summary: {
        totalLeads,
        totalCustomers,
        totalInteractions,
        totalFollowUps,
        totalFeedback,
        totalRetentionActivities,
        totalLoyaltyAccounts,
        totalSales,
        paidSales,
        pendingSales,
      },

      sales: {
        totalSales,
        paidSales,
        pendingSales,
        totalRevenue: revenue.totalRevenue,
        totalAmount: revenue.totalAmount,
        byStatus: salesByStatus,
      },

      leads: {
        byStatus: leadsByStatus,
      },

      feedback: {
        byStatus: feedbackByStatus,
      },

      followUps: {
        byStatus: followUpsByStatus,
      },

      retention: {
        byStatus: retentionByStatus,
      },

      loyalty: {
        totalPoints: loyaltyTotals.totalPoints,
        totalEarned: loyaltyTotals.totalEarned,
        totalRedeemed: loyaltyTotals.totalRedeemed,
        byTier: loyaltyByTier,
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);

    res.status(500).json({
      message: "Server error. Unable to generate report.",
    });
  }
});

module.exports = router;