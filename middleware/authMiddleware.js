const User = require("../models/User");

// Protect routes that require a logged-in user.
exports.requireAuth = async (req, res, next) => {
  try {
    // No user ID means there is no authenticated session.
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    // Retrieve the logged-in user's account.
    const user = await User.findById(req.session.userId);

    // The account may have been deleted after login.
    if (!user) {
      return res.redirect("/login");
    }

    // Make the user available to the next controller.
    req.user = user;

    // Continue processing the request.
    next();

  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).send("Authentication failed.");
  }
};

// Restrict routes to a specific account type.
exports.requireRole = (role) => {
  // Return middleware configured for the requested role.
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).send("Access denied.");
    }

    next();
  };
};