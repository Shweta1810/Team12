const express = require("express");
const mongoose = require("mongoose");

const FollowUp = require("../models/FollowUp");
const Customer = require("../models/Customer");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// Get the Sales Staff ID linked to the logged-in user
const getCustomerOwnerId = async (req) => {
  if (req.user.role === "Admin") {
    return null;
  }

  if (req.user.role === "Support Staff") {
    const supportStaff = await User.findById(req.user.userId)
      .select("reportsTo");

    return supportStaff?.reportsTo || null;
  }

  if (req.user.role === "Sales Staff") {
    return req.user.userId;
  }

  return null;
};

// Check whether the logged-in user can access a customer
const canAccessCustomer = async (req, customerId) => {
  if (req.user.role === "Admin") {
    return true;
  }

  const ownerId = await getCustomerOwnerId(req);

  if (!ownerId) {
    return false;
  }

  const customer = await Customer.findOne({
    _id: customerId,
    assignedTo: ownerId,
  });

  return !!customer;
};

// Check whether the logged-in user can access a follow-up
const canAccessFollowUp = async (req, followUp) => {
  if (req.user.role === "Admin") {
    return true;
  }

  return canAccessCustomer(req, followUp.customer);
};

/*
 * CREATE / SCHEDULE FOLLOW-UP
 *
 * Admin: Any customer
 * Sales Staff: Own customers
 * Support Staff: Customers of linked Sales Staff
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      customer,
      type,
      scheduledDate,
      notes,
    } = req.body;

    if (!customer || !type || !scheduledDate) {
      return res.status(400).json({
        message:
          "Customer, follow-up type and scheduled date are required.",
      });
    }

    if (!mongoose.isValidObjectId(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    const validDate = new Date(scheduledDate);

    if (Number.isNaN(validDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid scheduled date.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "You are not allowed to schedule follow-ups.",
      });
    }

    const existingCustomer = await Customer.findById(customer);

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    const authorized = await canAccessCustomer(
      req,
      customer
    );

    if (!authorized) {
      return res.status(403).json({
        message:
          "You are not authorized to schedule a follow-up for this customer.",
      });
    }

    const followUp = new FollowUp({
      customer,
      staff: req.user.userId,
      type: type.trim(),
      scheduledDate: validDate,
      notes: typeof notes === "string" ? notes.trim() : "",
      status: "Scheduled",
    });

    await followUp.save();

    const populatedFollowUp = await FollowUp.findById(
      followUp._id
    )
      .populate("customer", "name email phone status")
      .populate("staff", "name email role");

    return res.status(201).json({
      message: "Follow-up scheduled successfully.",
      followUp: populatedFollowUp,
    });
  } catch (error) {
    console.error("Create follow-up error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * GET FOLLOW-UPS
 *
 * Admin: All follow-ups
 * Sales Staff: Follow-ups for own customers
 * Support Staff: Follow-ups for linked Sales Staff's customers
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    let followUps;

    if (req.user.role === "Admin") {
      followUps = await FollowUp.find()
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ scheduledDate: 1 });
    } else if (
      ["Sales Staff", "Support Staff"].includes(req.user.role)
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json({
          count: 0,
          followUps: [],
        });
      }

      const customers = await Customer.find({
        assignedTo: ownerId,
      }).select("_id");

      const customerIds = customers.map(
        (customer) => customer._id
      );

      followUps = await FollowUp.find({
        customer: { $in: customerIds },
      })
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ scheduledDate: 1 });
    } else {
      return res.status(403).json({
        message: "You are not allowed to view follow-ups.",
      });
    }

    // Automatically mark past scheduled follow-ups as overdue
    const now = new Date();

    for (const followUp of followUps) {
      if (
        followUp.status === "Scheduled" &&
        new Date(followUp.scheduledDate) < now
      ) {
        followUp.status = "Overdue";
        await followUp.save();
      }
    }

    return res.json({
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * COMPLETE FOLLOW-UP
 *
 * Admin: Any follow-up
 * Sales Staff: Follow-ups for own customers
 * Support Staff: Follow-ups for linked Sales Staff's customers
 */
router.put(
  "/:id/complete",
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid follow-up ID.",
        });
      }

      const followUp = await FollowUp.findById(id);

      if (!followUp) {
        return res.status(404).json({
          message: "Follow-up not found.",
        });
      }

      const authorized = await canAccessFollowUp(
        req,
        followUp
      );

      if (!authorized) {
        return res.status(403).json({
          message:
            "You are not authorized to update this follow-up.",
        });
      }

      followUp.status = "Completed";

      await followUp.save();

      const updatedFollowUp = await FollowUp.findById(
        followUp._id
      )
        .populate("customer", "name email phone status")
        .populate("staff", "name email role");

      return res.json({
        message: "Follow-up marked as completed.",
        followUp: updatedFollowUp,
      });
    } catch (error) {
      console.error("Complete follow-up error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * RESCHEDULE FOLLOW-UP
 *
 * Admin: Any follow-up
 * Sales Staff: Follow-ups for own customers
 * Support Staff: Follow-ups for linked Sales Staff's customers
 */
router.put(
  "/:id/reschedule",
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledDate } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid follow-up ID.",
        });
      }

      if (!scheduledDate) {
        return res.status(400).json({
          message: "New scheduled date is required.",
        });
      }

      const validDate = new Date(scheduledDate);

      if (Number.isNaN(validDate.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid scheduled date.",
        });
      }

      const followUp = await FollowUp.findById(id);

      if (!followUp) {
        return res.status(404).json({
          message: "Follow-up not found.",
        });
      }

      const authorized = await canAccessFollowUp(
        req,
        followUp
      );

      if (!authorized) {
        return res.status(403).json({
          message:
            "You are not authorized to reschedule this follow-up.",
        });
      }

      followUp.scheduledDate = validDate;
      followUp.status = "Rescheduled";

      await followUp.save();

      const updatedFollowUp = await FollowUp.findById(
        followUp._id
      )
        .populate("customer", "name email phone status")
        .populate("staff", "name email role");

      return res.json({
        message: "Follow-up rescheduled successfully.",
        followUp: updatedFollowUp,
      });
    } catch (error) {
      console.error("Reschedule follow-up error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;