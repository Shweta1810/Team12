const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Customer = require("../models/Customer");
const authenticateUser = require("../middleware/auth");
const { createAuditLog } = require("../utils/auditLogger");

const router = express.Router();

// Audit logging
const logAction = async (
  req,
  action,
  description,
  targetId = null,
  status = "SUCCESS"
) => {
  try {
    await createAuditLog({
      user: req.user?.userId || null,
      username: req.user?.name || "Unknown",
      userRole: req.user?.role || "Unknown",
      action,
      module: "User Management",
      description,
      targetId,
      status,
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error("Audit logging failed.");
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

// GET all staff accounts
router.get("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find(
      {
        role: {
          $in: ["Sales Staff", "Support Staff"],
        },
      },
      { password: 0 }
    )
      .populate("reportsTo", "name email role status")
      .sort({ createdAt: -1 });

    return res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users request failed:", error);

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// GET ALL Sales Staff for assignment dropdown
router.get(
  "/sales-staff",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      // No status filter: include every Sales Staff account
      const salesStaff = await User.find(
        {
          role: "Sales Staff",
        },
        {
          name: 1,
          email: 1,
          role: 1,
          status: 1,
        }
      ).sort({ name: 1 });

      return res.json({
        count: salesStaff.length,
        users: salesStaff,
      });
    } catch (error) {
      console.error("Get Sales Staff request failed:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

// CREATE Sales Staff or Support Staff
router.post("/", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      reportsTo,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message: "Name, email, password and role are required.",
      });
    }

    if (!["Sales Staff", "Support Staff"].includes(role)) {
      return res.status(400).json({
        message: "Invalid staff role.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    let linkedSalesStaff = null;

    if (role === "Support Staff") {
      if (!reportsTo || !mongoose.isValidObjectId(reportsTo)) {
        return res.status(400).json({
          message: "Select a Sales Staff member.",
        });
      }

      linkedSalesStaff = await User.findOne({
        _id: reportsTo,
        role: "Sales Staff",
      });

      if (!linkedSalesStaff) {
        return res.status(400).json({
          message: "Selected Sales Staff account does not exist.",
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status: "Active",
      reportsTo:
        role === "Support Staff" ? linkedSalesStaff._id : null,
    });

    await user.save();

    await logAction(
      req,
      "CREATE",
      `Created ${user.role} account: ${user.name} (${user.email})`,
      user._id.toString()
    );

    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("reportsTo", "name email role");

    return res.status(201).json({
      message: "Staff account created successfully.",
      user: populatedUser,
    });
  } catch (error) {
    console.error("Create user request failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

// UPDATE Support Staff assignment
router.patch(
  "/:id/assignment",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reportsTo } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      if (!reportsTo || !mongoose.isValidObjectId(reportsTo)) {
        return res.status(400).json({
          message: "Select a valid Sales Staff member.",
        });
      }

      const supportStaff = await User.findOne({
        _id: id,
        role: "Support Staff",
      });

      if (!supportStaff) {
        return res.status(404).json({
          message: "Support Staff account not found.",
        });
      }

      const salesStaff = await User.findOne({
        _id: reportsTo,
        role: "Sales Staff",
      });

      if (!salesStaff) {
        return res.status(400).json({
          message: "Selected Sales Staff account does not exist.",
        });
      }

      supportStaff.reportsTo = salesStaff._id;

      await supportStaff.save();

      await logAction(
        req,
        "UPDATE",
        `Changed ${supportStaff.name}'s assigned Sales Staff to ${salesStaff.name}.`,
        supportStaff._id.toString()
      );

      const updatedUser = await User.findById(supportStaff._id)
        .select("-password")
        .populate("reportsTo", "name email role");

      return res.json({
        message: "Support Staff assignment updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update staff assignment failed:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

// DELETE staff account
router.delete(
  "/:id",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          message: "Staff account not found.",
        });
      }

      if (!["Sales Staff", "Support Staff"].includes(user.role)) {
        return res.status(403).json({
          message: "Admin accounts cannot be deleted.",
        });
      }

      if (user.role === "Sales Staff") {
        const linkedSupportCount = await User.countDocuments({
          reportsTo: user._id,
          role: "Support Staff",
        });

        if (linkedSupportCount > 0) {
          return res.status(409).json({
            message:
              "This Sales Staff member has linked Support Staff accounts. Reassign them before deleting this account.",
            linkedSupportCount,
          });
        }
      }

      const assignedCustomerCount = await Customer.countDocuments({
        assignedTo: user._id,
      });

      if (assignedCustomerCount > 0) {
        return res.status(409).json({
          message:
            "This staff member still has assigned customers. Reassign all customers before deleting this account.",
          assignedCustomerCount,
        });
      }

      const deletedUserId = user._id.toString();
      const deletedUserName = user.name;
      const deletedUserEmail = user.email;
      const deletedUserRole = user.role;

      await User.findByIdAndDelete(user._id);

      await logAction(
        req,
        "DELETE",
        `Deleted ${deletedUserRole} account: ${deletedUserName} (${deletedUserEmail})`,
        deletedUserId
      );

      return res.json({
        message: `Staff account ${deletedUserEmail} deleted successfully.`,
        deletedUserId,
      });
    } catch (error) {
      console.error("Delete user request failed:", error);

      return res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;