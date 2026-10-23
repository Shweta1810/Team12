const express = require("express");
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

const CUSTOMER_SOURCES = [
  "Website",
  "Social Media",
  "Referral",
  "Advertisement",
  "Campaign",
  "Other",
];

const CUSTOMER_STATUSES = ["Active", "Inactive"];

const SERVER_ERROR = {
  message: "Server error. Please try again.",
};

/*
 * Admin can reach every customer; staff only reach their own.
 */
const ownerFilter = (req) =>
  req.user.role === "Admin"
    ? {}
    : { assignedTo: req.user.userId };

const populateOwner = (query) =>
  query.populate("assignedTo", "name email role");

/*
 * Create a new customer
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

    if (
      source !== undefined &&
      !CUSTOMER_SOURCES.includes(source)
    ) {
      return res.status(400).json({
        message: "Invalid customer source.",
      });
    }

    if (
      status !== undefined &&
      !CUSTOMER_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid customer status.",
      });
    }

    let customerOwner;

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

      customerOwner = staff._id;
    } else {
      customerOwner = req.user.userId;
    }

    // Possible-duplicate warning: the user may cancel or continue.
    if (confirmDuplicate !== true) {
      const matches = await findDuplicates(
        { email, phone },
        { customers: true }
      );

      if (matches.length > 0) {
        return res.status(409).json({
          duplicate: true,
          message:
            "A customer with the same email or phone already exists.",
          matches,
        });
      }
    }

    const customer = new Customer({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      source: source || "Other",
      status: status || "Active",
      assignedTo: customerOwner,
      notes: notes ? String(notes).trim() : "",
    });

    await customer.save();

    const populatedCustomer = await populateOwner(
      Customer.findById(customer._id)
    );

    res.status(201).json({
      message: "Customer created successfully.",
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Get customers (CRM-F-024)
 *
 * Optional query parameters:
 *   search     - matches name, email or phone
 *   status     - Active | Inactive
 *   source     - one of the sources
 *   assignedTo - staff id (Admin only)
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { search, status, source, assignedTo } = req.query;

    const filter = ownerFilter(req);

    if (status) {
      filter.status = String(status);
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

    const customers = await populateOwner(
      Customer.find(filter).sort({ createdAt: -1 })
    );

    res.json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Get one customer
 */
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const customer = await populateOwner(
      Customer.findOne({
        _id: req.params.id,
        ...ownerFilter(req),
      })
    );

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

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Update a customer profile (CRM-F-023)
 * The owner is changed only through PATCH /:id/assign.
 */
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      ...ownerFilter(req),
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const {
      name,
      email,
      phone,
      source,
      status,
      notes,
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

    if (
      source !== undefined &&
      !CUSTOMER_SOURCES.includes(source)
    ) {
      return res.status(400).json({
        message: "Invalid customer source.",
      });
    }

    if (
      status !== undefined &&
      !CUSTOMER_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid customer status.",
      });
    }

    const emailChanged =
      email !== undefined &&
      email.toLowerCase().trim() !== customer.email;
    const phoneChanged =
      phone !== undefined &&
      phone &&
      phone.trim() !== (customer.phone || "");

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
          customers: true,
          excludeCustomerId: customer._id,
        }
      );

      if (matches.length > 0) {
        return res.status(409).json({
          duplicate: true,
          message:
            "A customer with the same email or phone already exists.",
          matches,
        });
      }
    }

    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined)
      customer.email = email.toLowerCase().trim();
    if (phone !== undefined)
      customer.phone = phone ? phone.trim() : "";
    if (source !== undefined) customer.source = source;
    if (status !== undefined) customer.status = status;
    if (notes !== undefined) customer.notes = String(notes).trim();

    await customer.save();

    const populatedCustomer = await populateOwner(
      Customer.findById(customer._id)
    );

    res.json({
      message: "Customer updated successfully.",
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json(SERVER_ERROR);
  }
});

/*
 * Assign (or reassign) a customer to a staff member
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
          message: "Customer not found.",
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

      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        { assignedTo: staff._id },
        { returnDocument: "after" }
      );

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found.",
        });
      }

      const populatedCustomer = await populateOwner(
        Customer.findById(customer._id)
      );

      res.json({
        message: "Customer assigned successfully.",
        customer: populatedCustomer,
      });
    } catch (error) {
      console.error("Assign customer error:", error);

      res.status(500).json(SERVER_ERROR);
    }
  }
);

module.exports = router;
