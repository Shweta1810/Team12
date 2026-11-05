const express = require("express");
const Interaction = require("../models/Interaction");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Allowed roles for Interaction Management
 */
const canAccessInteractions = (role) => {
  return role === "Admin" || role === "Sales Staff";
};

/*
 * Create a new interaction
 */
router.post("/", authenticateUser, async (req, res) => {
  try {

    // Block Support Staff
    if (!canAccessInteractions(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to access Interactions.",
      });
    }

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
     * Check that customer exists
     */
    const existingCustomer = await Customer.findById(customer);

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found.",
      });
    }

    /*
     * Admin can create interactions for any customer.
     * Sales Staff can create interactions only
     * for their assigned customers.
     */
    if (
      req.user.role !== "Admin" &&
      String(existingCustomer.assignedTo) !==
        String(req.user.userId)
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
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    await interaction.save();

    const populatedInteraction = await Interaction.findById(
      interaction._id
    )
      .populate("customer", "name email phone status")
      .populate("staff", "name email role");

    return res.status(201).json({
      message: "Interaction recorded successfully.",
      interaction: populatedInteraction,
    });

  } catch (error) {

    console.error("Create interaction error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});


/*
 * Get interactions
 */
router.get("/", authenticateUser, async (req, res) => {
  try {

    // Block Support Staff
    if (!canAccessInteractions(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to view Interactions.",
      });
    }

    let interactions;

    /*
     * Admin can view all interactions
     */
    if (req.user.role === "Admin") {

      interactions = await Interaction.find()
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ date: -1 });

    }

    /*
     * Sales Staff can view their own interactions
     */
    else if (req.user.role === "Sales Staff") {

      interactions = await Interaction.find({
        staff: req.user.userId,
      })
        .populate("customer", "name email phone status")
        .populate("staff", "name email role")
        .sort({ date: -1 });

    }

    return res.json({
      count: interactions.length,
      interactions,
    });

  } catch (error) {

    console.error("Get interactions error:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;