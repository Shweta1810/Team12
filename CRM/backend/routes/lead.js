const express = require("express");
const mongoose = require("mongoose");

const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Allowed roles for Lead Management
const canAccessLeads = (role) => {
  return role === "Admin" || role === "Sales Staff";
};

// Create a new lead
router.post("/", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to access Leads."
      });
    }

    const {
      name,
      email,
      phone,
      source,
      status,
      assignedTo,
      notes
    } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        message: "Name, email and phone number are required."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Validate name
    if (normalizedName.length < 2) {
      return res.status(400).json({
        message: "Name must contain at least 2 characters."
      });
    }

    // Validate email
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    // Validate phone
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits."
      });
    }

    // Determine lead owner
    let leadOwner;

    if (req.user.role === "Admin") {

      let staff;

      if (assignedTo) {

        if (!mongoose.isValidObjectId(assignedTo)) {
          return res.status(400).json({
            message: "Invalid assigned staff ID."
          });
        }

        staff = await User.findById(assignedTo);

      } else {

        staff = await User.findOne({
          role: "Sales Staff",
          status: "Active"
        }).sort({ createdAt: 1 });

      }

      if (
        !staff ||
        staff.role !== "Sales Staff" ||
        staff.status !== "Active"
      ) {
        return res.status(400).json({
          message: "Select or create an active Sales Staff account."
        });
      }

      leadOwner = staff._id;

    } else if (req.user.role === "Sales Staff") {

      leadOwner = req.user.userId;

    }

    // Create lead
    const lead = new Lead({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      source: source || "Other",
      status: status || "New",
      assignedTo: leadOwner,
      notes: typeof notes === "string" ? notes.trim() : ""
    });

    await lead.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Lead created successfully.",
      lead: populatedLead
    });

  } catch (error) {
    console.error("Create lead request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});


// Get all leads
router.get("/", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to view Leads."
      });
    }

    let leads;

    if (req.user.role === "Admin") {

      leads = await Lead.find()
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

    } else {

      leads = await Lead.find({
        assignedTo: req.user.userId
      })
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

    }

    return res.json({
      count: leads.length,
      leads
    });

  } catch (error) {
    console.error("Get leads request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});


// Get one lead
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to view Leads."
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID."
      });
    }

    let lead;

    if (req.user.role === "Admin") {

      lead = await Lead.findById(req.params.id)
        .populate("assignedTo", "name email role");

    } else {

      lead = await Lead.findOne({
        _id: req.params.id,
        assignedTo: req.user.userId
      }).populate("assignedTo", "name email role");

    }

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found."
      });
    }

    return res.json({ lead });

  } catch (error) {
    console.error("Get lead request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});


// Convert a lead into a customer
router.post("/:id/convert", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to convert Leads."
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID."
      });
    }

    let lead;

    if (req.user.role === "Admin") {

      lead = await Lead.findById(req.params.id);

    } else {

      lead = await Lead.findOne({
        _id: req.params.id,
        assignedTo: req.user.userId
      });

    }

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found."
      });
    }

    if (lead.status === "Converted") {
      return res.status(400).json({
        message: "This lead has already been converted."
      });
    }

    if (lead.status === "Lost") {
      return res.status(400).json({
        message: "A lost lead cannot be converted."
      });
    }

    // Check whether customer already exists
    const existingCustomer = await Customer.findOne({
      email: lead.email
    });

    if (existingCustomer) {
      return res.status(409).json({
        message: "A customer with this email already exists."
      });
    }

    // Create customer
    const customer = new Customer({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: "Active",
      assignedTo: lead.assignedTo,
      notes: lead.notes
    });

    await customer.save();

    // Update lead status
    lead.status = "Converted";
    await lead.save();

    const populatedCustomer = await Customer.findById(customer._id)
      .populate("assignedTo", "name email role");

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Lead converted to customer successfully.",
      lead: populatedLead,
      customer: populatedCustomer
    });

  } catch (error) {
    console.error("Convert lead request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});


// Delete a lead
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to delete Leads."
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID."
      });
    }

    let lead;

    if (req.user.role === "Admin") {

      lead = await Lead.findByIdAndDelete(req.params.id);

    } else {

      lead = await Lead.findOneAndDelete({
        _id: req.params.id,
        assignedTo: req.user.userId
      });

    }

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found or you do not have permission to delete it."
      });
    }

    return res.status(200).json({
      message: "Lead deleted successfully."
    });

  } catch (error) {
    console.error("Delete lead request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});

module.exports = router;