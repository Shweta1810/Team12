const express = require("express");
const Interaction = require("../models/Interaction");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Create a new interaction
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      customer,
      type,
      date,
      notes,
    } = req.body;

    if (!customer || !type) {
      return res.status(400).json({
        message: "Customer and interaction type are required.",
      });
    }

    /*
     * Check that the customer exists
     */
    const existingCustomer = await Customer.findById(
      customer
    );

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    /*
     * Staff can create interactions only
     * for customers assigned to them.
     *
     * Admin can create interactions for any customer.
     */
    if (
      req.user.role !== "Admin" &&
      existingCustomer.assignedTo.toString() !==
        req.user.userId
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to add an interaction for this customer.",
      });
    }

    const interaction = new Interaction({
      customer,
      staff: req.user.userId,
      type,
      date: date || new Date(),
      notes: notes ? notes.trim() : "",
    });

    await interaction.save();

    const populatedInteraction =
      await Interaction.findById(
        interaction._id
      )
        .populate(
          "customer",
          "name email phone status"
        )
        .populate(
          "staff",
          "name email role"
        );

    res.status(201).json({
      message: "Interaction recorded successfully.",
      interaction: populatedInteraction,
    });
  } catch (error) {
    console.error(
      "Create interaction error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Get interactions
 * Supports optional query param: ?type=Call|Email|Meeting|Chat|Other
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { type } = req.query;

    /*
     * Build the filter object.
     * If a type query param is provided, filter by it.
     */
    const filter = {};

    if (
      type &&
      ["Call", "Email", "Meeting", "Chat", "Other"].includes(
        type
      )
    ) {
      filter.type = type;
    }

    let interactions;

    if (req.user.role === "Admin") {
      interactions = await Interaction.find(filter)
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
      interactions = await Interaction.find({
        ...filter,
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
      count: interactions.length,
      interactions,
    });
  } catch (error) {
    console.error(
      "Get interactions error:",
      error
    );

    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

/*
 * Update an interaction (edit type, date, notes)
 * Only the staff who created it or an Admin can edit.
 */
router.put(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const interaction =
        await Interaction.findById(req.params.id);

      if (!interaction) {
        return res.status(404).json({
          message: "Interaction not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        interaction.staff.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to edit this interaction.",
        });
      }

      const { type, date, notes } = req.body;

      if (type) {
        interaction.type = type;
      }

      if (date) {
        interaction.date = date;
      }

      if (notes !== undefined) {
        interaction.notes = notes.trim();
      }

      await interaction.save();

      const updatedInteraction =
        await Interaction.findById(
          interaction._id
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
        message: "Interaction updated successfully.",
        interaction: updatedInteraction,
      });
    } catch (error) {
      console.error(
        "Update interaction error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * Delete an interaction
 * Only the staff who created it or an Admin can delete.
 */
router.delete(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const interaction =
        await Interaction.findById(req.params.id);

      if (!interaction) {
        return res.status(404).json({
          message: "Interaction not found.",
        });
      }

      if (
        req.user.role !== "Admin" &&
        interaction.staff.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to delete this interaction.",
        });
      }

      await Interaction.findByIdAndDelete(req.params.id);

      res.json({
        message: "Interaction deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete interaction error:",
        error
      );

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;