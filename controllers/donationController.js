const mongoose = require("mongoose");
const Donation = require("../models/Donation");

// ==========================================
// 1. GET DASHBOARD
// ==========================================
// Retrieve all donations and display them.

exports.getDashboard = async (req, res) => {
  try {
    // Find donations, newest first.
    // Populate replaces the creator's ID with their name.
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    // Send the user and donations to the dashboard.
    res.render("dashboard", {
      user: req.user,
      donations
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Unable to load donations.");
  }
};


// ==========================================
// 2. SHOW NEW DONATION FORM
// ==========================================

exports.showNewDonation = (req, res) => {
  res.render("newDonation", {
    error: null
  });
};


// ==========================================
// 3. CREATE DONATION
// ==========================================
// Save a new donation submitted by a business.

exports.createDonation = async (req, res) => {
  try {
    // Get the form data.
    const {
      title,
      description,
      quantity,
      pickupLocation,
      pickupTime
    } = req.body;

    // Validate required fields.
    if (
      !title?.trim() ||
      !description?.trim() ||
      !pickupLocation?.trim() ||
      !pickupTime
    ) {
      return res.status(400).render("newDonation", {
        error: "Please complete all fields."
      });
    }

    // Convert quantity into a number.
    const parsedQuantity = Number(quantity);

    // Quantity must be a positive whole number.
    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res.status(400).render("newDonation", {
        error: "Quantity must be a positive whole number."
      });
    }

    // Convert the pickup date into a Date object.
    const parsedPickupTime = new Date(pickupTime);

    if (Number.isNaN(parsedPickupTime.getTime())) {
      return res.status(400).render("newDonation", {
        error: "Please enter a valid pickup date."
      });
    }

    // Save the donation in MongoDB.
    await Donation.create({
      title: title.trim(),
      description: description.trim(),
      quantity: parsedQuantity,
      pickupLocation: pickupLocation.trim(),
      pickupTime: parsedPickupTime,

      // Automatically assign ownership to the logged-in business.
      createdBy: req.user._id
    });

    res.redirect("/dashboard");

  } catch (error) {
    console.error("Create donation error:", error);

    res.status(500).render("newDonation", {
      error: "Unable to create donation."
    });
  }
};


// ==========================================
// 4. SHOW EDIT DONATION FORM
// ==========================================

exports.showEditDonation = async (req, res) => {
  try {
    // Check whether the URL contains a valid MongoDB ID.
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send("Donation not found.");
    }

    // Find a donation belonging to the logged-in business.
    // Claimed donations cannot be edited.
    const donation = await Donation.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      status: "available"
    });

    if (!donation) {
      return res.status(404).send("Donation not found.");
    }

    res.render("editDonation", {
      donation,
      error: null
    });

  } catch (error) {
    console.error("Edit donation error:", error);
    res.status(500).send("Unable to load donation.");
  }
};


// ==========================================
// 5. UPDATE DONATION
// ==========================================

exports.updateDonation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send("Donation not found.");
    }

    const {
      title,
      description,
      quantity,
      pickupLocation,
      pickupTime
    } = req.body;

    const parsedQuantity = Number(quantity);
    const parsedPickupTime = new Date(pickupTime);

    // Validate submitted information.
    if (
      !title?.trim() ||
      !description?.trim() ||
      !pickupLocation?.trim() ||
      !pickupTime ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      Number.isNaN(parsedPickupTime.getTime())
    ) {
      return res.status(400).send("Invalid donation details.");
    }

    // Update only a donation owned by the logged-in business.
    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
        status: "available"
      },
      {
        title: title.trim(),
        description: description.trim(),
        quantity: parsedQuantity,
        pickupLocation: pickupLocation.trim(),
        pickupTime: parsedPickupTime
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!donation) {
      return res.status(404).send("Donation not found.");
    }

    res.redirect("/dashboard");

  } catch (error) {
    console.error("Update donation error:", error);
    res.status(500).send("Unable to update donation.");
  }
};


// ==========================================
// 6. DELETE DONATION
// ==========================================

exports.deleteDonation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send("Donation not found.");
    }

    // Delete only if the user owns the donation
    // and the donation is still available.
    const donation = await Donation.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
      status: "available"
    });

    if (!donation) {
      return res.status(404).send("Donation not found.");
    }

    res.redirect("/dashboard");

  } catch (error) {
    console.error("Delete donation error:", error);
    res.status(500).send("Unable to delete donation.");
  }
};


// ==========================================
// 7. CLAIM DONATION
// ==========================================
// Allow recipients to claim available donations.

exports.claimDonation = async (req, res) => {
  try {
    // Check that the donation ID is valid.
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send("Donation not found.");
    }

    // Find an available donation and update it.
    // The availability check and update happen atomically.
    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "available"
      },
      {
        // Change its status to claimed.
        status: "claimed",

        // Save the recipient's user ID.
        claimedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Another recipient may have already claimed it.
    if (!donation) {
      return res.status(409).send(
        "This donation is no longer available."
      );
    }

    // Return to the dashboard.
    res.redirect("/dashboard");

  } catch (error) {
    console.error("Claim donation error:", error);
    res.status(500).send("Unable to claim donation.");
  }
};