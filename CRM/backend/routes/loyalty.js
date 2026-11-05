const express = require("express");
const mongoose = require("mongoose");

const LoyaltyAccount = require("../models/LoyaltyAccount");
const Customer = require("../models/Customer");
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

// Check whether the user can access a loyalty account
const canAccessLoyaltyAccount = async (req, account) => {
  if (req.user.role === "Admin") {
    return true;
  }

  return canAccessCustomer(req, account.customer);
};

// CREATE LOYALTY ACCOUNT
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { customer } = req.body;

    if (!customer) {
      return res.status(400).json({
        message: "Customer is required.",
      });
    }

    if (!mongoose.isValidObjectId(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "You are not allowed to create loyalty accounts.",
      });
    }

    const customerExists = await Customer.findById(customer);

    if (!customerExists) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const authorized = await canAccessCustomer(req, customer);

    if (!authorized) {
      return res.status(403).json({
        message:
          "You are not authorized to manage loyalty for this customer.",
      });
    }

    const existingAccount = await LoyaltyAccount.findOne({
      customer,
    });

    if (existingAccount) {
      return res.status(409).json({
        message: "Loyalty account already exists for this customer.",
      });
    }

    const account = await LoyaltyAccount.create({
      customer,
      points: 0,
      tier: "Bronze",
      totalEarned: 0,
      totalRedeemed: 0,
    });

    const populatedAccount = await LoyaltyAccount.findById(
      account._id
    ).populate("customer", "name email phone");

    return res.status(201).json({
      message: "Loyalty account created successfully.",
      account: populatedAccount,
    });
  } catch (error) {
    console.error("Create loyalty account error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// GET LOYALTY ACCOUNTS
router.get("/", authenticateUser, async (req, res) => {
  try {
    let accounts;

    if (req.user.role === "Admin") {
      accounts = await LoyaltyAccount.find()
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 });
    } else if (
      ["Sales Staff", "Support Staff"].includes(req.user.role)
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json([]);
      }

      const customers = await Customer.find({
        assignedTo: ownerId,
      }).select("_id");

      const customerIds = customers.map(
        (customer) => customer._id
      );

      accounts = await LoyaltyAccount.find({
        customer: { $in: customerIds },
      })
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "You are not allowed to view loyalty accounts.",
      });
    }

    return res.json(accounts);
  } catch (error) {
    console.error("Get loyalty accounts error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// ADD LOYALTY POINTS
router.put("/:id/points", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid loyalty account ID.",
      });
    }

    if (
      points === undefined ||
      typeof points !== "number" ||
      !Number.isInteger(points) ||
      points <= 0
    ) {
      return res.status(400).json({
        message: "Points must be a positive whole number.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "You are not allowed to allocate loyalty points.",
      });
    }

    const account = await LoyaltyAccount.findById(id);

    if (!account) {
      return res.status(404).json({
        message: "Loyalty account not found.",
      });
    }

    const authorized = await canAccessLoyaltyAccount(
      req,
      account
    );

    if (!authorized) {
      return res.status(403).json({
        message:
          "You are not authorized to allocate points to this customer.",
      });
    }

    account.points += points;
    account.totalEarned += points;
    account.lastActivityDate = new Date();

    // Update tier according to total earned points
    if (account.totalEarned >= 1000) {
      account.tier = "Platinum";
    } else if (account.totalEarned >= 500) {
      account.tier = "Gold";
    } else if (account.totalEarned >= 250) {
      account.tier = "Silver";
    } else {
      account.tier = "Bronze";
    }

    await account.save();

    const updatedAccount = await LoyaltyAccount.findById(
      account._id
    ).populate("customer", "name email phone");

    return res.json({
      message: "Loyalty points added successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Add loyalty points error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// REDEEM LOYALTY POINTS
router.put("/:id/redeem", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid loyalty account ID.",
      });
    }

    if (
      points === undefined ||
      typeof points !== "number" ||
      !Number.isInteger(points) ||
      points <= 0
    ) {
      return res.status(400).json({
        message: "Points must be a positive whole number.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "You are not allowed to redeem loyalty points.",
      });
    }

    const account = await LoyaltyAccount.findById(id);

    if (!account) {
      return res.status(404).json({
        message: "Loyalty account not found.",
      });
    }

    const authorized = await canAccessLoyaltyAccount(
      req,
      account
    );

    if (!authorized) {
      return res.status(403).json({
        message:
          "You are not authorized to redeem points for this customer.",
      });
    }

    if (points > account.points) {
      return res.status(400).json({
        message: "Insufficient loyalty points.",
      });
    }

    account.points -= points;
    account.totalRedeemed += points;
    account.lastActivityDate = new Date();

    await account.save();

    const updatedAccount = await LoyaltyAccount.findById(
      account._id
    ).populate("customer", "name email phone");

    return res.json({
      message: "Loyalty points redeemed successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Redeem loyalty points error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;