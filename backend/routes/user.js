const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

/*
 * Check whether the logged-in user is an Admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

/*
 * Get all staff users
 * Admin only
 */
router.get(
  "/",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await User.find(
        {
          role: {
            $in: ["Sales Staff", "Support Staff"],
          },
        },
        {
          password: 0,
        }
      ).sort({ createdAt: -1 });

      res.json({
        count: users.length,
        users,
      });
    } catch (error) {
      console.error("Get users error:", error);

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * Create a new staff user
 * Admin only
 */
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "Name, email, password and role are required.",
        });
      }

      if (!["Sales Staff", "Support Staff"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

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
      });

      await user.save();

      res.status(201).json({
        message: "User created successfully.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Create user error:", error);

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

/*
 * Delete a staff user
 * Admin only
 *
 * Only Sales Staff and Support Staff can be deleted.
 * Admin accounts cannot be deleted through this route.
 */
router.delete(
  "/:id",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
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

      await User.findByIdAndDelete(id);

      res.json({
        message: `Staff account ${user.email} deleted successfully.`,
        deletedUserId: user._id,
      });
    } catch (error) {
      console.error("Delete user error:", error);

      res.status(500).json({
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;