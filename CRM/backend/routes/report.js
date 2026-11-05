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

function countByStatus(records, statuses) {
const result = {};

statuses.forEach((status) => {
result[status] = 0;
});

records.forEach((record) => {
if (Object.prototype.hasOwnProperty.call(result, record.status)) {
result[record.status]++;
}
});

return result;
}

router.get("/", authenticateUser, async (req, res) => {
try {
const { userId, role } = req.user;


if (role !== "Admin" && role !== "Sales Staff") {
  return res.status(403).json({
    message: "You are not authorized to access reports.",
  });
}

const isAdmin = role === "Admin";

const leadFilter = isAdmin ? {} : { assignedTo: userId };
const customerFilter = isAdmin ? {} : { assignedTo: userId };
const staffFilter = isAdmin ? {} : { staff: userId };
const saleFilter = isAdmin ? {} : { salesperson: userId };

const customerIds = isAdmin
  ? []
  : await Customer.find(customerFilter).distinct("_id");

const loyaltyFilter = isAdmin
  ? {}
  : { customer: { $in: customerIds } };

// Fetch counts and records using normal Mongoose queries.
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

  salesRecords,
  leadRecords,
  feedbackRecords,
  followUpRecords,
  retentionRecords,
  loyaltyRecords,
] = await Promise.all([
  Lead.countDocuments(leadFilter),
  Customer.countDocuments(customerFilter),
  Interaction.countDocuments(staffFilter),
  FollowUp.countDocuments(staffFilter),
  Feedback.countDocuments(staffFilter),
  RetentionActivity.countDocuments(staffFilter),
  LoyaltyAccount.countDocuments(loyaltyFilter),

  Sale.countDocuments(saleFilter),
  Sale.countDocuments({
    ...saleFilter,
    paymentStatus: "Paid",
  }),
  Sale.countDocuments({
    ...saleFilter,
    paymentStatus: "Pending",
  }),

  Sale.find(saleFilter).select("amount paymentStatus").lean(),
  Lead.find(leadFilter).select("status").lean(),
  Feedback.find(staffFilter).select("status").lean(),
  FollowUp.find(staffFilter).select("status").lean(),
  RetentionActivity.find(staffFilter).select("status").lean(),
  LoyaltyAccount.find(loyaltyFilter)
    .select("points totalEarned totalRedeemed tier")
    .lean(),
]);

// SALES REPORT
const totalRevenue = salesRecords.reduce((sum, sale) => {
  return sum + (
    sale.paymentStatus === "Paid"
      ? Number(sale.amount) || 0
      : 0
  );
}, 0);

const totalAmount = salesRecords.reduce((sum, sale) => {
  return sum + (Number(sale.amount) || 0);
}, 0);

const salesByStatus = {
  Pending: 0,
  Paid: 0,
  Cancelled: 0,
};

salesRecords.forEach((sale) => {
  if (Object.prototype.hasOwnProperty.call(
    salesByStatus,
    sale.paymentStatus
  )) {
    salesByStatus[sale.paymentStatus]++;
  }
});

// LEAD REPORT
const leadsByStatus = countByStatus(leadRecords, [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
]);

// FEEDBACK REPORT
const feedbackByStatus = countByStatus(feedbackRecords, [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
]);

// FOLLOW-UP REPORT
const followUpsByStatus = countByStatus(followUpRecords, [
  "Scheduled",
  "Completed",
  "Rescheduled",
  "Overdue",
]);

// RETENTION REPORT
const retentionByStatus = countByStatus(retentionRecords, [
  "Planned",
  "Completed",
  "Cancelled",
]);

// LOYALTY REPORT
const loyaltyTotals = loyaltyRecords.reduce(
  (totals, account) => {
    totals.totalPoints += Number(account.points) || 0;
    totals.totalEarned += Number(account.totalEarned) || 0;
    totals.totalRedeemed += Number(account.totalRedeemed) || 0;

    return totals;
  },
  {
    totalPoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
  }
);

const loyaltyByTier = {
  Bronze: 0,
  Silver: 0,
  Gold: 0,
  Platinum: 0,
};

loyaltyRecords.forEach((account) => {
  if (Object.prototype.hasOwnProperty.call(
    loyaltyByTier,
    account.tier
  )) {
    loyaltyByTier[account.tier]++;
  }
});

return res.json({
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
    totalRevenue,
    totalAmount,
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


return res.status(500).json({
  message: "Server error. Unable to generate report.",
});


}
});

module.exports = router;
