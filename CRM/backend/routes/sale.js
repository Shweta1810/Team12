const express = require("express");
const mongoose = require("mongoose");

const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const User = require("../models/User");

const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Get the Sales Staff ID linked to the logged-in user
const getCustomerOwnerId = async (req) => {
  if (req.user.role === "Admin") {
    return null;
  }

  if (req.user.role === "Support Staff") {
    const supportStaff = await User.findById(req.user.userId)
      .select("reportsTo");

    return supportStaff?.reportsTo || null;
  }

  if (req.user.role === "Sales Staff") {
    return req.user.userId;
  }

  return null;
};

// Check whether the user can access a customer
const canAccessCustomer = async (req, customerId) => {
  if (req.user.role === "Admin") {
    return true;
  }

  const ownerId = await getCustomerOwnerId(req);

  if (!ownerId) {
    return false;
  }

  const customer = await Customer.findOne({
    _id: customerId,
    assignedTo: ownerId,
  });

  return !!customer;
};

// Automatically award loyalty points for paid sales
const awardLoyaltyPoints = async (customerId, amount) => {
  const pointsToAdd = Math.floor(amount / 100);

  if (pointsToAdd <= 0) {
    return;
  }

  let loyaltyAccount = await LoyaltyAccount.findOne({
    customer: customerId,
  });

  if (!loyaltyAccount) {
    loyaltyAccount = await LoyaltyAccount.create({
      customer: customerId,
      points: 0,
      tier: "Bronze",
      totalEarned: 0,
      totalRedeemed: 0,
      lastActivityDate: new Date(),
    });
  }

  loyaltyAccount.points += pointsToAdd;
  loyaltyAccount.totalEarned += pointsToAdd;
  loyaltyAccount.lastActivityDate = new Date();

  if (loyaltyAccount.totalEarned >= 1000) {
    loyaltyAccount.tier = "Platinum";
  } else if (loyaltyAccount.totalEarned >= 500) {
    loyaltyAccount.tier = "Gold";
  } else if (loyaltyAccount.totalEarned >= 250) {
    loyaltyAccount.tier = "Silver";
  } else {
    loyaltyAccount.tier = "Bronze";
  }

  await loyaltyAccount.save();
};

// CREATE A SALE
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(role)
    ) {
      return res.status(403).json({
        message: "You are not authorized to create a sale.",
      });
    }

    const {
      customer,
      productService,
      quantity,
      amount,
      date,
      paymentStatus,
    } = req.body;

    if (
      !customer ||
      !productService ||
      quantity === undefined ||
      amount === undefined
    ) {
      return res.status(400).json({
        message:
          "Customer, product/service, quantity and amount are required.",
      });
    }

    if (!mongoose.isValidObjectId(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        message: "Amount must be a valid non-negative number.",
      });
    }

    if (
      paymentStatus &&
      !["Pending", "Paid", "Cancelled"].includes(paymentStatus)
    ) {
      return res.status(400).json({
        message: "Invalid payment status.",
      });
    }

    const customerRecord = await Customer.findById(customer);

    if (!customerRecord) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const authorized = await canAccessCustomer(req, customer);

    if (!authorized) {
      return res.status(403).json({
        message:
          "You can only record sales for customers assigned to your team.",
      });
    }

    // Attribute Support Staff sales to their linked Sales Staff member.
    const ownerId =
      role === "Support Staff"
        ? await getCustomerOwnerId(req)
        : userId;

    if (!ownerId) {
      return res.status(403).json({
        message:
          "Your account is not linked to a Sales Staff member.",
      });
    }

    const sale = await Sale.create({
      customer,
      salesperson: ownerId,
      productService: productService.trim(),
      quantity: Number(quantity),
      amount,
      date: date || new Date(),
      paymentStatus: paymentStatus || "Pending",
      loyaltyPointsAwarded: false,
    });

    // Award points once if the sale is created as Paid
    if (sale.paymentStatus === "Paid") {
      await awardLoyaltyPoints(sale.customer, sale.amount);

      sale.loyaltyPointsAwarded = true;
      await sale.save();
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role");

    return res.status(201).json({
      message: "Sale recorded successfully.",
      sale: populatedSale,
    });
  } catch (error) {
    console.error("Create sale error:", error);

    return res.status(500).json({
      message: "Server error. Unable to record sale.",
    });
  }
});

// GET SALES
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { role } = req.user;

    let filter = {};

    if (role === "Admin") {
      filter = {};
    } else if (
      role === "Sales Staff" ||
      role === "Support Staff"
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json({
          message: "Sales fetched successfully.",
          sales: [],
        });
      }

      const customers = await Customer.find({
        assignedTo: ownerId,
      }).select("_id");

      const customerIds = customers.map(
        (customer) => customer._id
      );

      filter = {
        customer: { $in: customerIds },
      };
    } else {
      return res.status(403).json({
        message: "You are not authorized to view sales.",
      });
    }

    const sales = await Sale.find(filter)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role")
      .sort({ date: -1 });

    return res.json({
      message: "Sales fetched successfully.",
      sales,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    return res.status(500).json({
      message: "Server error. Unable to fetch sales.",
    });
  }
});

// UPDATE PAYMENT STATUS
router.patch("/:id/payment-status", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const { role } = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid sale ID.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(role)
    ) {
      return res.status(403).json({
        message: "You are not authorized to update payments.",
      });
    }

    if (
      !["Pending", "Paid", "Cancelled"].includes(paymentStatus)
    ) {
      return res.status(400).json({
        message: "Invalid payment status.",
      });
    }

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found.",
      });
    }

    const authorized = await canAccessCustomer(
      req,
      sale.customer
    );

    if (!authorized) {
      return res.status(403).json({
        message:
          "You are not authorized to update this customer's payment.",
      });
    }

    // Do not allow a cancelled sale to be reopened
    if (sale.paymentStatus === "Cancelled" &&
        paymentStatus !== "Cancelled") {
      return res.status(400).json({
        message: "A cancelled sale cannot be reopened.",
      });
    }

    // Do not allow a paid sale to be changed to Pending or Cancelled
    if (sale.paymentStatus === "Paid" &&
        paymentStatus !== "Paid") {
      return res.status(400).json({
        message: "A paid sale cannot be changed to another status.",
      });
    }

    sale.paymentStatus = paymentStatus;

    // Award loyalty points only once
    if (
      paymentStatus === "Paid" &&
      !sale.loyaltyPointsAwarded
    ) {
      await awardLoyaltyPoints(sale.customer, sale.amount);

      sale.loyaltyPointsAwarded = true;
    }

    await sale.save();

    const updatedSale = await Sale.findById(sale._id)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role");

    return res.json({
      message: "Payment status updated successfully.",
      sale: updatedSale,
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      message: "Server error. Unable to update payment status.",
    });
  }
});

module.exports = router;