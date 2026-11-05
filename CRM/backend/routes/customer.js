const express = require("express");
const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const User = require("../models/User");
const CustomerDeletionRequest = require("../models/CustomerDeletionRequest");
const authenticateUser = require("../middleware/auth");
const { createAuditLog } = require("../utils/auditLogger");

const router = express.Router();

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

// Audit logging helper
const logAction = async (
  req,
  action,
  module,
  description,
  targetId = null
) => {
  try {
    await createAuditLog({
      user: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action,
      module,
      description,
      targetId,
      status: "SUCCESS",
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
};

// Get the customer owner for the logged-in user
const getCustomerOwnerId = async (req) => {
  if (req.user.role === "Support Staff") {
    const supportStaff = await User.findById(req.user.userId)
      .select("reportsTo");

    return supportStaff?.reportsTo || null;
  }

  return req.user.userId;
};

// CREATE customer
// Admin and Sales Staff only
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

    if (!["Admin", "Sales Staff"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to create customers.",
      });
    }

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

    const normalizedPhone =
      typeof phone === "string" ? phone.replace(/\D/g, "") : "";

    if (phone && normalizedPhone.length !== 10) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    let customerOwner;

    if (req.user.role === "Admin") {
      let staff;

      if (assignedTo) {
        if (!mongoose.isValidObjectId(assignedTo)) {
          return res.status(400).json({
            message: "Invalid assigned staff ID.",
          });
        }

        staff = await User.findById(assignedTo);
      } else {
        staff = await User.findOne({
          role: "Sales Staff",
          status: "Active",
        }).sort({ createdAt: 1 });
      }

      if (!staff) {
        return res.status(400).json({
          message:
            "Create an active Sales Staff account before adding customers.",
        });
      }

      if (
        staff.role !== "Sales Staff" ||
        staff.status !== "Active"
      ) {
        return res.status(400).json({
          message: "Select an active Sales Staff account.",
        });
      }

      customerOwner = staff._id;
    } else {
      customerOwner = req.user.userId;
    }

    const customer = new Customer({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
      status: ["Active", "Inactive"].includes(status)
        ? status
        : "Active",
      assignedTo: customerOwner,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    await customer.save();

    await logAction(
      req,
      "CREATE",
      "Customer",
      `Created customer: ${customer.name}`,
      customer._id
    );

    const populatedCustomer = await Customer.findById(customer._id)
      .populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Customer created successfully.",
      customer: populatedCustomer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// GET customers
// Admin: all customers
// Sales Staff: own customers
// Support Staff: customers assigned to their linked Sales Staff
router.get("/", authenticateUser, async (req, res) => {
  try {
    let customers;

    if (req.user.role === "Admin") {
      customers = await Customer.find()
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    } else if (
      req.user.role === "Sales Staff" ||
      req.user.role === "Support Staff"
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json({
          count: 0,
          customers: [],
        });
      }

      customers = await Customer.find({
        assignedTo: ownerId,
      })
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "You are not allowed to view customers.",
      });
    }

    return res.json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// Submit customer deletion request
// Sales Staff only
router.post(
  "/:id/deletion-request",
  authenticateUser,
  async (req, res) => {
    try {
      if (req.user.role !== "Sales Staff") {
        return res.status(403).json({
          message: "Only Sales Staff can request customer deletion.",
        });
      }

      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid customer ID.",
        });
      }

      const customer = await Customer.findOne({
        _id: id,
        assignedTo: req.user.userId,
      });

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found in your assigned customers.",
        });
      }

      const existingRequest =
        await CustomerDeletionRequest.findOne({
          customer: customer._id,
          status: "Pending",
        });

      if (existingRequest) {
        return res.status(409).json({
          message:
            "A deletion request is already pending for this customer.",
          request: existingRequest,
        });
      }

      const reason =
        typeof req.body.reason === "string"
          ? req.body.reason.trim()
          : "";

      const deletionRequest =
        await CustomerDeletionRequest.create({
          customer: customer._id,
          requestedBy: req.user.userId,
          reason,
        });

      await logAction(
        req,
        "CREATE",
        "CustomerDeletionRequest",
        `Requested deletion of customer: ${customer.name}`,
        deletionRequest._id
      );

      const populatedRequest =
        await CustomerDeletionRequest.findById(
          deletionRequest._id
        )
          .populate("customer", "name email phone")
          .populate("requestedBy", "name email role");

      return res.status(201).json({
        message: "Customer deletion request submitted to Admin.",
        request: populatedRequest,
      });
    } catch (error) {
      console.error("Submit deletion request error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

// GET all customer deletion requests
// Admin only
router.get(
  "/deletion-requests/all",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const requests = await CustomerDeletionRequest.find()
        .populate("customer", "name email phone")
        .populate("requestedBy", "name email role")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });

      return res.json({
        count: requests.length,
        requests,
      });
    } catch (error) {
      console.error("Get deletion requests error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

// Approve or reject customer deletion request
// Admin only
router.patch(
  "/deletion-requests/:requestId",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { decision, reviewNotes } = req.body;

      if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({
          message: "Invalid deletion request ID.",
        });
      }

      if (!["Approved", "Rejected"].includes(decision)) {
        return res.status(400).json({
          message: "Decision must be Approved or Rejected.",
        });
      }

      if (
        reviewNotes !== undefined &&
        typeof reviewNotes !== "string"
      ) {
        return res.status(400).json({
          message: "Review notes must be text.",
        });
      }

      const request = await CustomerDeletionRequest.findOne({
        _id: requestId,
        status: "Pending",
      });

      if (!request) {
        return res.status(404).json({
          message: "Deletion request not found or already reviewed.",
        });
      }

      let deletedCustomerName = "Unknown customer";

      if (decision === "Approved") {
        const customer = await Customer.findById(request.customer);

        if (!customer) {
          return res.status(409).json({
            message:
              "Customer no longer exists. The request cannot be approved.",
          });
        }

        deletedCustomerName = customer.name;

        await Customer.findByIdAndDelete(customer._id);

        await logAction(
          req,
          "DELETE",
          "Customer",
          `Deleted customer after Admin approval: ${deletedCustomerName}`,
          customer._id
        );
      }

      request.status = decision;
      request.reviewedBy = req.user.userId;
      request.reviewedAt = new Date();
      request.reviewNotes =
        typeof reviewNotes === "string"
          ? reviewNotes.trim()
          : "";

      await request.save();

      await logAction(
        req,
        decision === "Approved" ? "APPROVE" : "REJECT",
        "CustomerDeletionRequest",
        `${decision} customer deletion request ${request._id}`,
        request._id
      );

      return res.json({
        message:
          decision === "Approved"
            ? "Request approved. Customer deleted."
            : "Request rejected. Customer was not deleted.",
        result: {
          requestId: request._id,
          decision: request.status,
        },
      });
    } catch (error) {
      console.error("Review deletion request error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

// GET one customer
// Admin: any customer
// Sales Staff: own customer
// Support Staff: customer assigned to linked Sales Staff
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    let customer;

    if (req.user.role === "Admin") {
      customer = await Customer.findById(req.params.id)
        .populate("assignedTo", "name email role");
    } else if (
      req.user.role === "Sales Staff" ||
      req.user.role === "Support Staff"
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.status(403).json({
          message: "Your account is not linked to a Sales Staff member.",
        });
      }

      customer = await Customer.findOne({
        _id: req.params.id,
        assignedTo: ownerId,
      }).populate("assignedTo", "name email role");
    } else {
      return res.status(403).json({
        message: "You are not allowed to view this customer.",
      });
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    return res.json({ customer });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;