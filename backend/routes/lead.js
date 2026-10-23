const express = require("express");
const Lead = require("../models/LeadModel");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const {
  isValidEmail,
  isValidPhone,
  isValidId,
  escapeRegex,
  findAssignableStaff,
} = require("../utils/validation");
const { findDuplicates } = require("../utils/duplicates");

const router = express.Router();

const LEAD_SOURCES = [
  "Website",
  "Social Media",
  "Referral",
  "Advertisement",
  "Campaign",
  "Other",
];

// Statuses a user may set directly. "Converted" is only reached
// through the convert endpoint.
const EDITABLE_STATUSES = ["New", "Contacted", "Qualified", "Lost"];

const SERVER_ERROR = {
  message: "Server error. Please try again.",
};

/*
 * Admin can reach every lead; staff only reach their own.
 */
const ownerFilter = (req) =>
  req.user.role === "Admin"
    ? {}
    : { assignedTo: req.user.userId };

const populateOwner = (query) =>
  query.populate("assignedTo", "name email role");

/*
 * Create a new lead
 */
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
      confirmDuplicate,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    if (source !== undefined && !LEAD_SOURCES.includes(source)) {
      return res.status(400).json({
        message: "Invalid lead source.",
      });
    }

    // New leads cannot start as Converted or Lost.
    if (
      status !== undefined &&
      !["New", "Contacted", "Qualified"].includes(status)
    ) {
      return res.status(400).json({
        message: "A new lead must start as New, Contacted or Qualified.",
      });
    }

    let leadOwner;

    if (req.user.role === "Admin") {
      if (!assignedTo) {
        return res.status(400).json({
          message: "Admin must select a staff member.",
        });
      }

      const staff = await findAssignableStaff(assignedTo);

      if (!staff) {
        return res.status(400).json({
          message: "Selected staff member is not valid or not active.",
        });
      }

      leadOwner = staff._id;
    } else {
      leadOwner = req.user.userId;
    }

    // Possible-duplicate warning: the user may cancel or continue.
    if (confirmDuplicate !== true) {
      const matches = await findDuplicates(
        { email, phone },
        { leads: true, customers: true }
      );

      if (matches.length > 0) {
        return res.status(409).json({
          duplicate: true,
          message:
            "A lead or customer with the same email or phone already exists.",
          matches,
        });
      }
    }

    const lead = new Lead({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      source: source || "Other",
      status: status || "New",
      assignedTo: leadOwner,
      notes: notes ? String(notes).trim() : "",
    });

    await lead.save();

    const populatedLead = await populateOwner(
      Lead.findById(lead._id)
    );

    res.status(201).json({
      message: "Lead created successfully.",
      lead: populatedLead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Get leads
 *
 * Optional query parameters:
 *   search     - matches name, email or phone
 *   status     - New | Contacted | Qualified | Converted | Lost | all
 *   source     - one of the lead sources
 *   assignedTo - staff id (Admin only)
 *
 * Lost leads are left out of the active list unless status=Lost
 * or status=all is requested (CRM-F-021).
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { search, status, source, assignedTo } = req.query;

    const filter = ownerFilter(req);

    if (status && status !== "all") {
      filter.status = String(status);
    } else if (!status) {
      filter.status = { $ne: "Lost" };
    }

    if (source) {
      filter.source = String(source);
    }

    if (assignedTo && req.user.role === "Admin") {
      if (!isValidId(assignedTo)) {
        return res.status(400).json({
          message: "Invalid staff id.",
        });
      }

      filter.assignedTo = assignedTo;
    }

    if (search && String(search).trim()) {
      const pattern = new RegExp(
        escapeRegex(String(search).trim()),
        "i"
      );

      filter.$or = [
        { name: pattern },
        { email: pattern },
        { phone: pattern },
      ];
    }

    const leads = await populateOwner(
      Lead.find(filter).sort({ createdAt: -1 })
    );

    res.json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Get one lead
 */
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    const lead = await populateOwner(
      Lead.findOne({
        _id: req.params.id,
        ...ownerFilter(req),
      })
    );

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

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Update a lead: contact details, source, notes and status.
 *
 * Status changes: New / Contacted / Qualified can be moved freely,
 * Lost needs a reason, and a Lost lead can be reopened.
 * Converted leads are locked.
 * The owner is changed only through PATCH /:id/assign.
 */
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...ownerFilter(req),
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found.",
      });
    }

    if (lead.status === "Converted") {
      return res.status(400).json({
        message: "A converted lead cannot be edited.",
      });
    }

    const {
      name,
      email,
      phone,
      source,
      status,
      notes,
      lostReason,
      confirmDuplicate,
    } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        message: "Name cannot be empty.",
      });
    }

    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (phone !== undefined && !isValidPhone(phone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    if (source !== undefined && !LEAD_SOURCES.includes(source)) {
      return res.status(400).json({
        message: "Invalid lead source.",
      });
    }

    if (status !== undefined) {
      if (status === "Converted") {
        return res.status(400).json({
          message: "Use the convert action to convert a lead.",
        });
      }

      if (!EDITABLE_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid lead status.",
        });
      }
    }

    const newStatus = status !== undefined ? status : lead.status;

    if (newStatus === "Lost") {
      const reason =
        lostReason !== undefined ? lostReason : lead.lostReason;

      if (typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({
          message: "A reason is required when marking a lead as Lost.",
        });
      }

      lead.lostReason = reason.trim();
    } else {
      // Reopened or still active: no lost reason applies.
      lead.lostReason = undefined;
    }

    // Warn when the new contact details match another record.
    const emailChanged =
      email !== undefined &&
      email.toLowerCase().trim() !== lead.email;
    const phoneChanged =
      phone !== undefined &&
      phone &&
      phone.trim() !== (lead.phone || "");

    if (
      (emailChanged || phoneChanged) &&
      confirmDuplicate !== true
    ) {
      const matches = await findDuplicates(
        {
          email: emailChanged ? email : null,
          phone: phoneChanged ? phone : null,
        },
        {
          leads: true,
          customers: true,
          excludeLeadId: lead._id,
        }
      );

      if (matches.length > 0) {
        return res.status(409).json({
          duplicate: true,
          message:
            "A lead or customer with the same email or phone already exists.",
          matches,
        });
      }
    }

    if (name !== undefined) lead.name = name.trim();
    if (email !== undefined) lead.email = email.toLowerCase().trim();
    if (phone !== undefined) lead.phone = phone ? phone.trim() : "";
    if (source !== undefined) lead.source = source;
    if (notes !== undefined) lead.notes = String(notes).trim();
    lead.status = newStatus;

    await lead.save();

    const populatedLead = await populateOwner(
      Lead.findById(lead._id)
    );

    res.json({
      message: "Lead updated successfully.",
      lead: populatedLead,
    });
  } catch (error) {
    console.error("Update lead error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Assign (or reassign) a lead to a staff member
 * Admin only
 */
router.patch(
  "/:id/assign",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(404).json({
          message: "Lead not found.",
        });
      }

      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({
          message: "Please select a staff member.",
        });
      }

      const staff = await findAssignableStaff(assignedTo);

      if (!staff) {
        return res.status(400).json({
          message: "Selected staff member is not valid or not active.",
        });
      }

      const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { assignedTo: staff._id },
        { returnDocument: "after" }
      );

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found.",
        });
      }

      const populatedLead = await populateOwner(
        Lead.findById(lead._id)
      );

      res.json({
        message: "Lead assigned successfully.",
        lead: populatedLead,
      });
    } catch (error) {
      console.error("Assign lead error:", error);

      res.status(500).json(SERVER_ERROR);
    }
  }
);

/*
 * Convert a Qualified lead into a customer (CRM-F-020)
 *
 * - Only Qualified leads can be converted.
 * - If a customer with the same email or phone already exists, the lead
 *   is linked to that customer instead of creating a duplicate.
 * - The status change is claimed atomically so a double click cannot
 *   create two customers.
 */
router.post(
  "/:id/convert",
  authenticateUser,
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(404).json({
          message: "Lead not found.",
        });
      }

      const lead = await Lead.findOne({
        _id: req.params.id,
        ...ownerFilter(req),
      });

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

      if (lead.status !== "Qualified") {
        return res.status(400).json({
          message: "Only Qualified leads can be converted.",
        });
      }

      // Look for an existing customer with the same email or phone.
      const matchConditions = [{ email: lead.email }];

      if (lead.phone) {
        matchConditions.push({ phone: lead.phone });
      }

      const existingCustomer = await Customer.findOne({
        $or: matchConditions,
      });

      if (
        existingCustomer &&
        req.user.role !== "Admin" &&
        existingCustomer.assignedTo.toString() !==
          req.user.userId
      ) {
        return res.status(409).json({
          message:
            "This person is already a customer assigned to another staff member. Please contact an Admin.",
        });
      }

      // Claim the conversion; only one request can win.
      const claimed = await Lead.findOneAndUpdate(
        { _id: lead._id, status: "Qualified" },
        { status: "Converted" },
        { returnDocument: "after" }
      );

      if (!claimed) {
        return res.status(409).json({
          message: "This lead was already changed. Please refresh.",
        });
      }

      let customer = existingCustomer;
      let linked = Boolean(existingCustomer);

      try {
        if (!customer) {
          customer = await Customer.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            status: "Active",
            assignedTo: lead.assignedTo,
            notes: lead.notes,
          });
        }

        await Lead.findByIdAndUpdate(lead._id, {
          convertedCustomer: customer._id,
        });
      } catch (innerError) {
        // Undo the claim so the lead is not stuck as Converted.
        await Lead.findByIdAndUpdate(lead._id, {
          status: "Qualified",
        });

        if (!linked && customer) {
          await Customer.findByIdAndDelete(customer._id);
        }

        throw innerError;
      }

      const populatedCustomer = await populateOwner(
        Customer.findById(customer._id)
      );

      const populatedLead = await populateOwner(
        Lead.findById(lead._id)
      );

      res.status(linked ? 200 : 201).json({
        message: linked
          ? "Lead linked to the existing customer."
          : "Lead converted to customer successfully.",
        linked,
        lead: populatedLead,
        customer: populatedCustomer,
      });
    } catch (error) {
      console.error("Convert lead error:", error);

      res.status(500).json(SERVER_ERROR);
    }
  }
);

module.exports = router;
