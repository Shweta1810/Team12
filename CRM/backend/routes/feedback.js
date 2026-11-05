const express = require("express");
const mongoose = require("mongoose");

const Feedback = require("../models/Feedback");
const Customer = require("../models/Customer");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Allowed feedback types (must match Feedback model)
const ALLOWED_TYPES = ["Feedback", "Complaint", "Issue"];

const ALLOWED_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed"
];

const ALLOWED_PRIORITIES = [
  "Low",
  "Medium",
  "High"
];

// Get the Sales Staff ID whose customers the user can access
const getCustomerOwnerId = async (req) => {
  const { userId, role } = req.user;

  if (role === "Admin") {
    return null;
  }

  if (role === "Sales Staff") {
    return userId;
  }

  if (role === "Support Staff") {
    const supportUser = await User.findById(userId)
      .select("reportsTo");

    if (!supportUser || !supportUser.reportsTo) {
      return null;
    }

    return supportUser.reportsTo;
  }

  return null;
};

// Check whether the logged-in user can access a customer
const canAccessCustomer = async (req, customerId) => {
  const { role } = req.user;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return false;
  }

  if (role === "Admin") {
    return true;
  }

  const ownerId = await getCustomerOwnerId(req);

  if (!ownerId) {
    return false;
  }

  const customer = await Customer.findById(customerId)
    .select("assignedTo");

  if (!customer) {
    return false;
  }

  return (
    String(customer.assignedTo) === String(ownerId)
  );
};

// CREATE FEEDBACK
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { customer, type, subject, description, priority } = req.body;

    if (!customer || !type || !subject || !description) {
      return res.status(400).json({
        message: "Please provide all required feedback details."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID."
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        message: "Invalid feedback type."
      });
    }

    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "Invalid priority."
      });
    }

    const { role, userId } = req.user;

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(role)
    ) {
      return res.status(403).json({
        message: "You are not authorized to create feedback."
      });
    }

    const hasAccess = await canAccessCustomer(req, customer);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You cannot access this customer."
      });
    }

    const newFeedback = await Feedback.create({
      customer,
      staff: userId,
      type,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      status: "Open"
    });

    const populatedFeedback = await Feedback.findById(
      newFeedback._id
    )
      .populate("customer", "name email phone status")
      .populate("staff", "name email role");

    return res.status(201).json({
      message: "Feedback created successfully.",
      feedback: populatedFeedback
    });

  } catch (error) {
    console.error("Create feedback error:", error);

    return res.status(500).json({
      message: "Failed to create feedback."
    });
  }
});


// GET FEEDBACK
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { role } = req.user;

    let query = {};

    if (role === "Admin") {
      // Admin can view all feedback
      query = {};
    } else if (
      role === "Sales Staff" ||
      role === "Support Staff"
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json([]);
      }

      // Only show feedback belonging to accessible customers
      const customers = await Customer.find({
        assignedTo: ownerId
      }).select("_id");

      const customerIds = customers.map(
        (customer) => customer._id
      );

      query = {
        customer: { $in: customerIds }
      };

    } else {
      return res.status(403).json({
        message: "You are not authorized to view feedback."
      });
    }

    const feedback = await Feedback.find(query)
      .populate("customer", "name email phone status")
      .populate("staff", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(feedback);

  } catch (error) {
    console.error("Get feedback error:", error);

    return res.status(500).json({
      message: "Failed to retrieve feedback."
    });
  }
});


// UPDATE FEEDBACK STATUS
router.put("/:id/status", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid feedback ID."
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid feedback status."
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found."
      });
    }

    const { role } = req.user;

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(role)
    ) {
      return res.status(403).json({
        message: "You are not authorized to update feedback."
      });
    }

    const hasAccess = await canAccessCustomer(
      req,
      feedback.customer
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You cannot update feedback for this customer."
      });
    }

    feedback.status = status;

    await feedback.save();

    const updatedFeedback = await Feedback.findById(id)
      .populate("customer", "name email phone status")
      .populate("staff", "name email role");

    return res.status(200).json({
      message: "Feedback status updated successfully.",
      feedback: updatedFeedback
    });

  } catch (error) {
    console.error("Update feedback error:", error);

    return res.status(500).json({
      message: "Failed to update feedback status."
    });
  }
});

module.exports = router;