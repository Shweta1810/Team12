const mongoose = require("mongoose");
const User = require("../models/User");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email.trim());

// Empty phone is allowed (optional field).
const isValidPhone = (phone) =>
  phone === undefined ||
  phone === null ||
  phone === "" ||
  (typeof phone === "string" && PHONE_REGEX.test(phone.trim()));

const isValidId = (id) => mongoose.isValidObjectId(id);

// Escape user input before using it in a regular expression.
const escapeRegex = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * Check that a user can own leads/customers:
 * the account must exist, be Active and be a staff member (not Admin).
 * Returns the user document, or null when the account is not suitable.
 */
const findAssignableStaff = async (userId) => {
  if (!isValidId(userId)) {
    return null;
  }

  return User.findOne({
    _id: userId,
    status: "Active",
    role: { $in: ["Sales Staff", "Support Staff"] },
  });
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidId,
  escapeRegex,
  findAssignableStaff,
};
