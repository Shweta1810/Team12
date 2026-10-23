/*
 * Allow the request only when the logged-in user is an Admin.
 * Must be used after authenticateUser.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

module.exports = requireAdmin;
