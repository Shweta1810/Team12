
const express = require("express");
const mongoose = require("mongoose");

const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

const canAccessLeads = (role) =>
  role === "Admin" || role === "Sales Staff";

// GET active Sales Staff for the Admin assignment dropdown.
// IMPORTANT: Keep this route BEFORE /:id.
router.get("/sales-staff", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to access Sales Staff.",
      });
    }

    if (req.user.role !== "Admin") {
      return res.json({
        canAssign: false,
        users: [],
      });
    }

    const users = await User.find({
      role: "Sales Staff",
      status: "Active",
    })
      .select("name email role status")
      .sort({ name: 1 });

    return res.json({
      canAssign: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Sales Staff failed:", error);
    return res.status(500).json({
      message: "Unable to load Sales Staff.",
    });
  }
});

// CREATE LEAD
router.post("/", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to create Leads.",
      });
    }

    const {
      name,
      email,
      phone,
      source,
      assignedTo,
      notes,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        message: "Name, email and phone number are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        message: "Name must contain at least 2 characters.",
      });
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    let leadOwner;

    if (req.user.role === "Admin") {
      if (!assignedTo || !mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({
          message: "Please select a Sales Staff member.",
        });
      }

      const staff = await User.findOne({
        _id: assignedTo,
        role: "Sales Staff",
        status: "Active",
      });

      if (!staff) {
        return res.status(400).json({
          message: "Selected Sales Staff account is not active or does not exist.",
        });
      }

      leadOwner = staff._id;
    } else {
      leadOwner = req.user.userId;

      const staff = await User.findOne({
        _id: leadOwner,
        role: "Sales Staff",
        status: "Active",
      });

      if (!staff) {
        return res.status(403).json({
          message: "Your Sales Staff account is not active.",
        });
      }
    }

    const lead = new Lead({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      source: source || "Other",
      status: "New",
      assignedTo: leadOwner,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    await lead.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Lead created successfully.",
      lead: populatedLead,
    });
  } catch (error) {
    console.error("Create lead failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// GET ALL LEADS
router.get("/", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to view Leads.",
      });
    }

    const filter =
      req.user.role === "Admin"
        ? {}
        : { assignedTo: req.user.userId };

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// GET ONE LEAD
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to view Leads.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID.",
      });
    }

    const filter =
      req.user.role === "Admin"
        ? { _id: req.params.id }
        : {
            _id: req.params.id,
            assignedTo: req.user.userId,
          };

    const lead = await Lead.findOne(filter)
      .populate("assignedTo", "name email role");

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    return res.json({ lead });
  } catch (error) {
    console.error("Get lead failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// CONVERT LEAD INTO CUSTOMER
router.post("/:id/convert", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to convert Leads.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID.",
      });
    }

    const filter =
      req.user.role === "Admin"
        ? { _id: req.params.id }
        : {
            _id: req.params.id,
            assignedTo: req.user.userId,
          };

    const lead = await Lead.findOne(filter);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    if (lead.status === "Converted") {
      return res.status(400).json({
        message: "This lead has already been converted.",
      });
    }

    if (lead.status === "Lost") {
      return res.status(400).json({
        message: "A lost lead cannot be converted.",
      });
    }

    const existingCustomer = await Customer.findOne({
      email: lead.email,
    });

    if (existingCustomer) {
      return res.status(409).json({
        message: "A customer with this email already exists.",
      });
    }

    const customer = new Customer({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: "Active",
      assignedTo: lead.assignedTo,
      notes: lead.notes,
    });

    await customer.save();

    lead.status = "Converted";
    await lead.save();

    const populatedCustomer = await Customer.findById(customer._id)
      .populate("assignedTo", "name email role");

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Lead converted to customer successfully.",
      lead: populatedLead,
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Convert lead failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// DELETE LEAD
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    if (!canAccessLeads(req.user.role)) {
      return res.status(403).json({
        message: "Support Staff are not allowed to delete Leads.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid lead ID.",
      });
    }

    const filter =
      req.user.role === "Admin"
        ? { _id: req.params.id }
        : {
            _id: req.params.id,
            assignedTo: req.user.userId,
          };

    const lead = await Lead.findOneAndDelete(filter);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found or you do not have permission to delete it.",
      });
    }

    return res.json({
      message: "Lead deleted successfully.",
    });
  } catch (error) {
    console.error("Delete lead failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;
