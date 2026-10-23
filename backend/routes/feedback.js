const express = require("express");
const Feedback = require("../models/Feedback");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Create feedback / complaint / issue
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      customer,
      type,
      subject,
      description,
      priority,
    } = req.body;

    if (
      !customer ||
      !type ||
      !subject ||
      !description
    ) {
      return res.status(400).json({
        message:
          "Customer, type, subject and description are required.",
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
     * Staff can only create feedback
     * for their assigned customers.
     */
    if (
      req.user.role !== "Admin" &&
      existingCustomer.assignedTo.toString() !==
        req.user.userId
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to create feedback for this customer.",
      });
    }

    const feedback = new Feedback({
      customer,
      staff: req.user.userId,
      type,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      status: "Open",
    });

    await feedback.save();

    const populatedFeedback =
      await Feedback.findById(feedback._id)
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
        "Feedback submitted successfully.",
      feedback: populatedFeedback,
    });
  } catch (error) {
    console.error(
      "Create feedback error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Get all feedback / complaints / issues
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    let feedback;

    if (req.user.role === "Admin") {
      feedback = await Feedback.find()
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        )
        .sort({ createdAt: -1 });
    } else {
      feedback = await Feedback.find({
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
        .sort({ createdAt: -1 });
    }

    res.json({
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error(
      "Get feedback error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Update feedback status
 */
router.put(
  "/:id/status",
  authenticateUser,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (
        ![
          "Open",
          "In Progress",
          "Resolved",
          "Closed",
        ].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid feedback status.",
        });
      }

      const feedback =
        await Feedback.findById(req.params.id);

      if (!feedback) {
        return res.status(404).json({
          message: "Feedback not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        feedback.staff.toString() !==
          req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this feedback.",
        });
      }

      feedback.status = status;

      await feedback.save();

      const updatedFeedback =
        await Feedback.findById(feedback._id)
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
          "Feedback status updated successfully.",
        feedback: updatedFeedback,
      });
    } catch (error) {
      console.error(
        "Update feedback status error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;