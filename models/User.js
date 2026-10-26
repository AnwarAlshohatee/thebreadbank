const mongoose = require("mongoose");

// A schema defines what information we store for each user.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // We store a hashed password, never the original password.
    passwordHash: {
      type: String,
      required: true
    },

    // Roles determine what actions a user can perform.
    role: {
      type: String,
      enum: ["business", "recipient"],
      required: true
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true
  }
);

// Create a Mongoose model to interact with the users collection.
module.exports = mongoose.model("User", userSchema);