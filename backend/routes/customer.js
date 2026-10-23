const express = require("express");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Create a new customer
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      status,
      assignedTo,
      notes,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    let customerOwner;

    if (req.user.role === "Admin") {
      if (!assignedTo) {
        return res.status(400).json({
          message: "Admin must select a staff member.",
        });
      }

      customerOwner = assignedTo;
    } else {
      customerOwner = req.user.userId;
    }

    const customer = new Customer({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      status: status || "Active",
      assignedTo: customerOwner,
      notes: notes ? notes.trim() : "",
    });

    await customer.save();

    const populatedCustomer =
      await Customer.findById(customer._id).populate(
        "assignedTo",
        "name email role"
      );

    res.status(201).json({
      message: "Customer created successfully.",
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Get customers
router.get("/", authenticateUser, async (req, res) => {
  try {
    let customers;

    if (req.user.role === "Admin") {
      customers = await Customer.find()
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    } else {
      customers = await Customer.find({
        assignedTo: req.user.userId,
      })
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    }

    res.json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Get one customer
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    let customer;

    if (req.user.role === "Admin") {
      customer = await Customer.findById(
        req.params.id
      ).populate(
        "assignedTo",
        "name email role"
      );
    } else {
      customer = await Customer.findOne({
        _id: req.params.id,
        assignedTo: req.user.userId,
      }).populate(
        "assignedTo",
        "name email role"
      );
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    res.json({
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;