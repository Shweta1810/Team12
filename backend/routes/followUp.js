const express = require("express");
const FollowUp = require("../models/FollowUp");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Create a new follow-up
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

    const existingCustomer =
      await Customer.findById(customer);

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    // Staff can only create follow-ups for their own customers
    if (
      req.user.role !== "Admin" &&
      existingCustomer.assignedTo.toString() !==
        req.user.userId
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to create a follow-up for this customer.",
      });
    }

    const followUp = new FollowUp({
      customer,
      staff: req.user.userId,
      type,
      scheduledDate,
      notes: notes ? notes.trim() : "",
      status: "Scheduled",
    });

    await followUp.save();

    const populatedFollowUp =
      await FollowUp.findById(followUp._id)
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        );

    res.status(201).json({
      message: "Follow-up scheduled successfully.",
      followUp: populatedFollowUp,
    });
  } catch (error) {
    console.error(
      "Create follow-up error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Get follow-ups
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    let followUps;

    if (req.user.role === "Admin") {
      followUps = await FollowUp.find()
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        )
        .sort({ scheduledDate: 1 });
    } else {
      followUps = await FollowUp.find({
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
        .sort({ scheduledDate: 1 });
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

    res.json({
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    console.error(
      "Get follow-ups error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Complete a follow-up
 */
router.put(
  "/:id/complete",
  authenticateUser,
  async (req, res) => {
    try {
      const followUp =
        await FollowUp.findById(req.params.id);

      if (!followUp) {
        return res.status(404).json({
          message: "Follow-up not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        followUp.staff.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this follow-up.",
        });
      }

      followUp.status = "Completed";

      await followUp.save();

      res.json({
        message: "Follow-up marked as completed.",
        followUp,
      });
    } catch (error) {
      console.error(
        "Complete follow-up error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * Reschedule a follow-up
 */
router.put(
  "/:id/reschedule",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        scheduledDate,
      } = req.body;

      if (!scheduledDate) {
        return res.status(400).json({
          message: "New scheduled date is required.",
        });
      }

      const followUp =
        await FollowUp.findById(req.params.id);

      if (!followUp) {
        return res.status(404).json({
          message: "Follow-up not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        followUp.staff.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this follow-up.",
        });
      }

      followUp.scheduledDate = scheduledDate;
      followUp.status = "Rescheduled";

      await followUp.save();

      res.json({
        message: "Follow-up rescheduled successfully.",
        followUp,
      });
    } catch (error) {
      console.error(
        "Reschedule follow-up error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * Delete a follow-up
 * Only the staff who created it or an Admin can delete.
 */
router.delete(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const followUp =
        await FollowUp.findById(req.params.id);

      if (!followUp) {
        return res.status(404).json({
          message: "Follow-up not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        followUp.staff.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to delete this follow-up.",
        });
      }

      await FollowUp.findByIdAndDelete(req.params.id);

      res.json({
        message: "Follow-up deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete follow-up error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;