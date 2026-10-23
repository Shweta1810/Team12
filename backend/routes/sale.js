const express = require("express");

const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const LoyaltyAccount = require("../models/LoyaltyAccount");

const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Create a sale
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Only Admin and Sales Staff can create sales
    if (role !== "Admin" && role !== "Sales Staff") {
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

    // Check required fields
    if (!customer || !productService || !quantity || amount === undefined) {
      return res.status(400).json({
        message: "Customer, product/service, quantity and amount are required.",
      });
    }

    // Find customer
    const customerRecord = await Customer.findById(customer);

    if (!customerRecord) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    // Sales Staff can only create sales for their assigned customers
    if (
      role !== "Admin" &&
      customerRecord.assignedTo.toString() !== userId
    ) {
      return res.status(403).json({
        message: "You can only create sales for your assigned customers.",
      });
    }

    // Create sale
    const sale = await Sale.create({
      customer,
      salesperson: userId,
      productService,
      quantity,
      amount,
      date: date || new Date(),
      paymentStatus: paymentStatus || "Pending",
    });

    // If the sale is Paid, automatically award loyalty points
    if (sale.paymentStatus === "Paid") {
      const pointsToAdd = Math.floor(sale.amount / 100);

      if (pointsToAdd > 0) {
        let loyaltyAccount = await LoyaltyAccount.findOne({
          customer: sale.customer,
        });

        // Create loyalty account if customer does not have one
        if (!loyaltyAccount) {
          loyaltyAccount = await LoyaltyAccount.create({
            customer: sale.customer,
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

        // Update loyalty tier
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
      }
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role");

    res.status(201).json({
      message: "Sale recorded successfully.",
      sale: populatedSale,
    });
  } catch (error) {
    console.error("Create sale error:", error);

    res.status(500).json({
      message: "Server error. Unable to record sale.",
    });
  }
});


// Get sales
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

    let filter = {};

    // Sales Staff can only see their own sales
    if (role === "Sales Staff") {
      filter.salesperson = userId;
    }

    // Support Staff cannot access sales
    if (role === "Support Staff") {
      return res.status(403).json({
        message: "You are not authorized to view sales.",
      });
    }

    const sales = await Sale.find(filter)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role")
      .sort({ date: -1 });

    res.json({
      message: "Sales fetched successfully.",
      sales,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    res.status(500).json({
      message: "Server error. Unable to fetch sales.",
    });
  }
});

module.exports = router;