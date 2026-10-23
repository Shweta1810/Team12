const express = require("express");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Create loyalty account
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { customer } = req.body;

    if (!customer) {
      return res.status(400).json({
        message: "Customer is required.",
      });
    }

    const customerExists = await Customer.findById(customer);

    if (!customerExists) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const existingAccount = await LoyaltyAccount.findOne({
      customer,
    });

    if (existingAccount) {
      return res.status(400).json({
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

    const populatedAccount = await LoyaltyAccount.findById(account._id)
      .populate("customer", "name email phone");

    res.status(201).json({
      message: "Loyalty account created successfully.",
      account: populatedAccount,
    });
  } catch (error) {
    console.error("Create loyalty account error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Get all loyalty accounts
router.get("/", authenticateUser, async (req, res) => {
  try {
    const accounts = await LoyaltyAccount.find()
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error) {
    console.error("Get loyalty accounts error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Add loyalty points
router.put("/:id/points", authenticateUser, async (req, res) => {
  try {
    const { points } = req.body;

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

    const account = await LoyaltyAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        message: "Loyalty account not found.",
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

    const updatedAccount = await LoyaltyAccount.findById(account._id)
      .populate("customer", "name email phone");

    res.json({
      message: "Loyalty points added successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Add loyalty points error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Redeem loyalty points
router.put("/:id/redeem", authenticateUser, async (req, res) => {
  try {
    const { points } = req.body;

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

    const account = await LoyaltyAccount.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        message: "Loyalty account not found.",
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

    const updatedAccount = await LoyaltyAccount.findById(account._id)
      .populate("customer", "name email phone");

    res.json({
      message: "Loyalty points redeemed successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Redeem loyalty points error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;