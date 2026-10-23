
const express = require("express");

const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const LoyaltyAccount = require("../models/LoyaltyAccount");

const authenticateUser = require("../middleware/auth");

const router = express.Router();

const calculateLoyaltyTier = (totalEarned) => {
  if (totalEarned >= 1000) return "Platinum";
  if (totalEarned >= 500) return "Gold";
  if (totalEarned >= 250) return "Silver";
  return "Bronze";
};

// Create a sale
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

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

    if (
      !customer ||
      typeof productService !== "string" ||
      !productService.trim() ||
      quantity === undefined ||
      amount === undefined
    ) {
      return res.status(400).json({
        message:
          "Customer, product/service, quantity and amount are required.",
      });
    }

    const quantityNumber = Number(quantity);
    const amountNumber = Number(amount);

    if (!Number.isInteger(quantityNumber) || quantityNumber < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number.",
      });
    }

    if (!Number.isFinite(amountNumber) || amountNumber < 0) {
      return res.status(400).json({
        message: "Amount must be a valid non-negative number.",
      });
    }

    const validStatuses = ["Pending", "Paid", "Cancelled"];
    const finalPaymentStatus = paymentStatus || "Pending";

    if (!validStatuses.includes(finalPaymentStatus)) {
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

    if (
      role !== "Admin" &&
      (!customerRecord.assignedTo ||
        customerRecord.assignedTo.toString() !== String(userId))
    ) {
      return res.status(403).json({
        message: "You can only create sales for your assigned customers.",
      });
    }

    const sale = await Sale.create({
      customer,
      salesperson: userId,
      productService: productService.trim(),
      quantity: quantityNumber,
      amount: amountNumber,
      date: date || new Date(),
      paymentStatus: finalPaymentStatus,
    });

    // Award loyalty points only when the sale is created as Paid.
    if (sale.paymentStatus === "Paid") {
      const pointsToAdd = Math.floor(sale.amount / 100);

      if (pointsToAdd > 0) {
        let loyaltyAccount = await LoyaltyAccount.findOne({
          customer: sale.customer,
        });

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
        loyaltyAccount.tier = calculateLoyaltyTier(
          loyaltyAccount.totalEarned
        );
        loyaltyAccount.lastActivityDate = new Date();

        await loyaltyAccount.save();
      }
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

// Get sales
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === "Support Staff") {
      return res.status(403).json({
        message: "You are not authorized to view sales.",
      });
    }

    const filter =
      role === "Sales Staff" ? { salesperson: userId } : {};

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

// Update an existing sale
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "Admin" && role !== "Sales Staff") {
      return res.status(403).json({
        message: "You are not authorized to edit sales.",
      });
    }

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found.",
      });
    }

    // Admin can edit any sale. Sales Staff can edit their own sales.
    if (
      role === "Sales Staff" &&
      String(sale.salesperson) !== String(userId)
    ) {
      return res.status(403).json({
        message: "You can only edit your own sales.",
      });
    }

    const {
      productService,
      quantity,
      amount,
      date,
      paymentStatus,
    } = req.body;

    if (productService !== undefined) {
      if (
        typeof productService !== "string" ||
        !productService.trim()
      ) {
        return res.status(400).json({
          message: "Product/service cannot be empty.",
        });
      }

      sale.productService = productService.trim();
    }

    if (quantity !== undefined) {
      const quantityNumber = Number(quantity);

      if (!Number.isInteger(quantityNumber) || quantityNumber < 1) {
        return res.status(400).json({
          message: "Quantity must be a positive whole number.",
        });
      }

      sale.quantity = quantityNumber;
    }

    if (amount !== undefined) {
      const amountNumber = Number(amount);

      if (!Number.isFinite(amountNumber) || amountNumber < 0) {
        return res.status(400).json({
          message: "Amount must be a valid non-negative number.",
        });
      }

      sale.amount = amountNumber;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);

      if (!date || Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid sale date.",
        });
      }

      sale.date = parsedDate;
    }

    if (paymentStatus !== undefined) {
      const validStatuses = ["Pending", "Paid", "Cancelled"];

      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          message: "Invalid payment status.",
        });
      }

      sale.paymentStatus = paymentStatus;
    }

    // Customer and salesperson are intentionally immutable in this endpoint.
    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate("customer", "name email phone")
      .populate("salesperson", "name email role");

    return res.json({
      message: "Sale updated successfully.",
      sale: populatedSale,
    });
  } catch (error) {
    console.error("Update sale error:", error);

    return res.status(500).json({
      message: "Server error. Unable to update sale.",
    });
  }
});

module.exports = router;

