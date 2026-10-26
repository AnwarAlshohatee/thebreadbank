const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Show the registration page.
exports.showRegister = (req, res) => {
  res.render("register", { error: null });
};

// Register a new user.
exports.register = async (req, res) => {
  try {
    // Get information submitted through the registration form.
    const { name, email, password, role } = req.body;

    // Validate required fields.
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).render("register", {
        error: "Please complete all fields."
      });
    }

    // Only allow the two supported account types.
    if (!["business", "recipient"].includes(role)) {
      return res.status(400).render("register", {
        error: "Please select a valid account type."
      });
    }

    // Require passwords to contain at least 8 characters.
    if (password.length < 8) {
      return res.status(400).render("register", {
        error: "Password must be at least 8 characters."
      });
    }

    // Normalize email so capitalization doesn't create duplicates.
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether this email is already registered.
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).render("register", {
        error: "An account with this email already exists."
      });
    }

    // Hash the password before saving it.
    // 12 is the bcrypt cost factor.
    const passwordHash = await bcrypt.hash(password, 12);

    // Save the new user in MongoDB.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role
    });

    // Regenerate the session when authentication changes.
    req.session.regenerate((error) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Unable to start session.");
      }

      // Store the user's MongoDB ID in the session.
      req.session.userId = user._id.toString();

      // Save the session before redirecting.
      req.session.save((error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Unable to save session.");
        }

        res.redirect("/dashboard");
      });
    });

  } catch (error) {
    console.error("Registration error:", error);

    // MongoDB duplicate-key error.
    if (error.code === 11000) {
      return res.status(400).render("register", {
        error: "An account with this email already exists."
      });
    }

    res.status(500).render("register", {
      error: "Something went wrong. Please try again."
    });
  }
};

// Show the login page.
exports.showLogin = (req, res) => {
  res.render("login", { error: null });
};

// Log in an existing user.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render("login", {
        error: "Email and password are required."
      });
    }

    // Find the account using its normalized email.
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    // Use the same error for unknown emails and incorrect passwords.
    if (!user) {
      return res.status(401).render("login", {
        error: "Invalid email or password."
      });
    }

    // Compare the submitted password against the stored hash.
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).render("login", {
        error: "Invalid email or password."
      });
    }

    // Give the authenticated user a fresh session.
    req.session.regenerate((error) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Unable to start session.");
      }

      req.session.userId = user._id.toString();

      req.session.save((error) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Unable to save session.");
        }

        res.redirect("/dashboard");
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).render("login", {
      error: "Something went wrong. Please try again."
    });
  }
};

// Log out the current user.
exports.logout = (req, res) => {
  // Destroy the server-side session.
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Unable to log out.");
    }

    // Clear the browser's session cookie.
    res.clearCookie("connect.sid");

    // Return to the homepage.
    res.redirect("/");
  });
};