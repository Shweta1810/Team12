const express = require("express");
const RetentionActivity = require("../models/RetentionActivity");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Create retention activity
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

    const existingCustomer =
      await Customer.findById(customer);

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    /*
     * Staff can only create retention activities
     * for their assigned customers.
     */
    if (
      req.user.role !== "Admin" &&
      existingCustomer.assignedTo.toString() !==
        req.user.userId
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to create a retention activity for this customer.",
      });
    }

    const activity = new RetentionActivity({
      customer,
      staff: req.user.userId,
      type,
      description: description.trim(),
      date: date || new Date(),
      status: "Planned",
    });

    await activity.save();

    const populatedActivity =
      await RetentionActivity.findById(activity._id)
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        );

    res.status(201).json({
      message:
        "Retention activity created successfully.",
      activity: populatedActivity,
    });
  } catch (error) {
    console.error(
      "Create retention activity error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Get retention activities
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    let activities;

    if (req.user.role === "Admin") {
      activities = await RetentionActivity.find()
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        )
        .sort({ date: -1 });
    } else {
      activities = await RetentionActivity.find({
        staff: req.user.userId,
      })
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        )
        .sort({ date: -1 });
    }

    res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(
      "Get retention activities error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Update retention activity status
 */
router.put(
  "/:id/status",
  authenticateUser,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (
        ![
          "Planned",
          "Completed",
          "Cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid retention activity status.",
        });
      }

      const activity =
        await RetentionActivity.findById(
          req.params.id
        );

      if (!activity) {
        return res.status(404).json({
          message:
            "Retention activity not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        activity.staff.toString() !==
          req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this retention activity.",
        });
      }

      activity.status = status;

      await activity.save();

      const updatedActivity =
        await RetentionActivity.findById(
          activity._id
        )
          .populate(
            "customer",
            "name email phone status"
          )
          .populate(
            "staff",
            "name email role"
          );

      res.json({
        message:
          "Retention activity status updated successfully.",
        activity: updatedActivity,
      });
    } catch (error) {
      console.error(
        "Update retention activity error:",
        error
      );

      res.status(500).json({
        message:
          "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;