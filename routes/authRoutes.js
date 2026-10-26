const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

// Display registration form.
router.get("/register", authController.showRegister);

// Process registration form.
router.post("/register", authController.register);

// Display login form.
router.get("/login", authController.showLogin);

// Process login form.
router.post("/login", authController.login);

// Log out an authenticated user.
router.post("/logout", requireAuth, authController.logout);

module.exports = router;