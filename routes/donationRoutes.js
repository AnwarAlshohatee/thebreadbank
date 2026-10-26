const express = require("express");
const router = express.Router();

const donationController = require("../controllers/donationController");

const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

// Every route in this file requires authentication.
router.use(requireAuth);

// Both businesses and recipients can view the dashboard.
router.get("/dashboard", donationController.getDashboard);

// Only business accounts can create donations.
router.get(
  "/donations/new",
  requireRole("business"),
  donationController.showNewDonation
);

router.post(
  "/donations",
  requireRole("business"),
  donationController.createDonation
);

// Only businesses can access edit functionality.
// Ownership is checked again inside the controller.
router.get(
  "/donations/:id/edit",
  requireRole("business"),
  donationController.showEditDonation
);

router.post(
  "/donations/:id/edit",
  requireRole("business"),
  donationController.updateDonation
);

// Only the business that created a listing can delete it.
router.post(
  "/donations/:id/delete",
  requireRole("business"),
  donationController.deleteDonation
);

// Only recipients can claim donations.
router.post(
  "/donations/:id/claim",
  requireRole("recipient"),
  donationController.claimDonation
);

module.exports = router;