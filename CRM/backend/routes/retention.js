const express = require("express");
const mongoose = require("mongoose");

const RetentionActivity = require("../models/RetentionActivity");
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

// Check whether user can access a customer
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

// Check whether user can access a retention activity
const canAccessActivity = async (req, activity) => {
  if (req.user.role === "Admin") {
    return true;
  }

  return canAccessCustomer(req, activity.customer);
};

/*
 * CREATE RETENTION ACTIVITY
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
      description,
      date,
    } = req.body;

    if (!customer || !type || !description) {
      return res.status(400).json({
        message:
          "Customer, activity type and description are required.",
      });
    }

    if (!mongoose.isValidObjectId(customer)) {
      return res.status(400).json({
        message: "Invalid customer ID.",
      });
    }

    if (
      !["Admin", "Sales Staff", "Support Staff"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to create retention activities.",
      });
    }

    const validTypes = [
      "Call",
      "Email",
      "Meeting",
      "Offer",
      "Discount",
      "Other",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid retention activity type.",
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
          "You are not authorized to create a retention activity for this customer.",
      });
    }

    let activityDate = new Date();

    if (date) {
      activityDate = new Date(date);

      if (Number.isNaN(activityDate.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid activity date.",
        });
      }
    }

    const activity = new RetentionActivity({
      customer,
      staff: req.user.userId,
      type,
      description: description.trim(),
      date: activityDate,
      status: "Planned",
    });

    await activity.save();

    const populatedActivity = await RetentionActivity.findById(
      activity._id
    )
      .populate("customer", "name email phone status")
      .populate("staff", "name email role");

    return res.status(201).json({
      message: "Retention activity created successfully.",
      activity: populatedActivity,
    });
  } catch (error) {
    console.error("Create retention activity error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * GET RETENTION ACTIVITIES
 *
 * Admin: All activities
 * Sales Staff: Activities for own customers
 * Support Staff: Activities for linked Sales Staff's customers
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    let activities;

    if (req.user.role === "Admin") {
      activities = await RetentionActivity.find()
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ date: -1 });
    } else if (
      ["Sales Staff", "Support Staff"].includes(req.user.role)
    ) {
      const ownerId = await getCustomerOwnerId(req);

      if (!ownerId) {
        return res.json({
          count: 0,
          activities: [],
        });
      }

      const customers = await Customer.find({
        assignedTo: ownerId,
      }).select("_id");

      const customerIds = customers.map(
        (customer) => customer._id
      );

      activities = await RetentionActivity.find({
        customer: { $in: customerIds },
      })
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ date: -1 });
    } else {
      return res.status(403).json({
        message:
          "You are not allowed to view retention activities.",
      });
    }

    return res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get retention activities error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * UPDATE RETENTION ACTIVITY STATUS
 *
 * Admin: Any activity
 * Sales Staff: Activities for own customers
 * Support Staff: Activities for linked Sales Staff's customers
 */
router.put(
  "/:id/status",
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid retention activity ID.",
        });
      }

      if (
        !["Planned", "Completed", "Cancelled"].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid retention activity status.",
        });
      }

      const activity = await RetentionActivity.findById(id);

      if (!activity) {
        return res.status(404).json({
          message: "Retention activity not found.",
        });
      }

      const authorized = await canAccessActivity(
        req,
        activity
      );

      if (!authorized) {
        return res.status(403).json({
          message:
            "You are not authorized to update this retention activity.",
        });
      }

      activity.status = status;

      await activity.save();

      const updatedActivity = await RetentionActivity.findById(
        activity._id
      )
        .populate("customer", "name email phone status")
        .populate("staff", "name email role");

      return res.json({
        message:
          "Retention activity status updated successfully.",
        activity: updatedActivity,
      });
    } catch (error) {
      console.error("Update retention activity error:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;