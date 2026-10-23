const express = require("express");
const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Create a new lead
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      source,
      status,
      assignedTo,
      notes,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    let leadOwner;

    if (req.user.role === "Admin") {
      if (!assignedTo) {
        return res.status(400).json({
          message: "Admin must select a staff member.",
        });
      }

      leadOwner = assignedTo;
    } else {
      leadOwner = req.user.userId;
    }

    const lead = new Lead({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      source: source || "Other",
      status: status || "New",
      assignedTo: leadOwner,
      notes: notes ? notes.trim() : "",
    });

    await lead.save();

    const populatedLead = await Lead.findById(
      lead._id
    ).populate("assignedTo", "name email role");

    res.status(201).json({
      message: "Lead created successfully.",
      lead: populatedLead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Get leads
router.get("/", authenticateUser, async (req, res) => {
  try {
    let leads;

    if (req.user.role === "Admin") {
      leads = await Lead.find()
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    } else {
      leads = await Lead.find({
        assignedTo: req.user.userId,
      })
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    }

    res.json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Get one lead
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    let lead;

    if (req.user.role === "Admin") {
      lead = await Lead.findById(req.params.id).populate(
        "assignedTo",
        "name email role"
      );
    } else {
      lead = await Lead.findOne({
        _id: req.params.id,
        assignedTo: req.user.userId,
      }).populate("assignedTo", "name email role");
    }

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    res.json({
      lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Convert a lead into a customer
router.post(
  "/:id/convert",
  authenticateUser,
  async (req, res) => {
    try {
      let lead;

      // Admin can convert any lead
      if (req.user.role === "Admin") {
        lead = await Lead.findById(req.params.id);
      } else {
        // Staff can convert only their own lead
        lead = await Lead.findOne({
          _id: req.params.id,
          assignedTo: req.user.userId,
        });
      }

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

      // Check whether a customer with the same email already exists
      const existingCustomer = await Customer.findOne({
        email: lead.email,
      });

      if (existingCustomer) {
        return res.status(409).json({
          message:
            "A customer with this email already exists.",
        });
      }

      // Create customer using lead information
      const customer = new Customer({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: "Active",
        assignedTo: lead.assignedTo,
        notes: lead.notes,
      });

      await customer.save();

      // Update lead status
      lead.status = "Converted";
      await lead.save();

      const populatedCustomer =
        await Customer.findById(
          customer._id
        ).populate(
          "assignedTo",
          "name email role"
        );

      const populatedLead =
        await Lead.findById(
          lead._id
        ).populate(
          "assignedTo",
          "name email role"
        );

      res.status(201).json({
        message:
          "Lead converted to customer successfully.",
        lead: populatedLead,
        customer: populatedCustomer,
      });
    } catch (error) {
      console.error("Convert lead error:", error);

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;