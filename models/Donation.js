const mongoose = require("mongoose");

// Define the information stored for each donation.
const donationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    // Number of food items available.
    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    // Where recipients will collect the food.
    pickupLocation: {
      type: String,
      required: true,
      trim: true
    },

    // When the donation is available for pickup.
    pickupTime: {
      type: Date,
      required: true
    },

    // A donation can be available or claimed.
    status: {
      type: String,
      enum: ["available", "claimed"],
      default: "available"
    },

    // Reference to the business that created this donation.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // We'll use this when recipients claim donations.
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Donation", donationSchema);