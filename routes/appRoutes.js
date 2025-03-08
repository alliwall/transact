const express = require("express");
const router = express.Router();
const { requireInvitation, requireFeature } = require("../middleware/auth");

// Public route - Landing page
router.get("/", (req, res) => {
  res.sendFile("landing.html", { root: "./public" });
});

// Public route - Invitation page
router.get("/invitation", (req, res) => {
  res.sendFile("invitation.html", { root: "./public" });
});

// Protected routes - require valid invitation
router.get("/merchant-payment", requireInvitation, (req, res) => {
  res.sendFile("merchant-payment.html", { root: "./public" });
});

// Protected routes - require specific features
router.get(
  "/payment-link",
  requireInvitation,
  requireFeature("generate_payment_link"),
  (req, res) => {
    res.sendFile("payment-link.html", { root: "./public" });
  }
);

router.get(
  "/generate-merchant-link",
  requireInvitation,
  requireFeature("generate_merchant_link"),
  (req, res) => {
    res.sendFile("generate-merchant-link.html", { root: "./public" });
  }
);

module.exports = router;
