const express = require("express");
const router = express.Router();
const path = require("path");

// Middleware to check if user has a valid invitation code in session
const requireInvitation = (req, res, next) => {
  if (!req.session || !req.session.invitation) {
    // Capture the full original URL (including path and query parameters)
    const originalUrl = req.originalUrl;

    // Redirect to invitation page with original URL as redirect_url parameter
    return res.redirect(
      `/invitation?redirect_url=${encodeURIComponent(originalUrl)}`
    );
  }
  next();
};

// Middleware to check if user has specific feature access
const requireFeature = (feature) => {
  return (req, res, next) => {
    if (
      !req.session ||
      !req.session.invitation ||
      !req.session.invitation.features ||
      !req.session.invitation.features.includes(feature)
    ) {
      // Capture the full original URL (including path and query parameters)
      const originalUrl = req.originalUrl;

      // Redirect to invitation page with original URL as redirect_url parameter
      return res.redirect(
        `/invitation?redirect_url=${encodeURIComponent(originalUrl)}`
      );
    }
    next();
  };
};

// Public routes
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

router.get("/invitation", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/invitation.html"));
});

router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// Public merchant payment route
router.get("/merchant-payment", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/merchant-payment.html"));
});

router.get(
  "/payment-link",
  requireInvitation,
  requireFeature("generate_payment_link"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/payment-link.html"));
  }
);

router.get(
  "/generate-merchant-link",
  requireInvitation,
  requireFeature("generate_merchant_link"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/generate-merchant-link.html"));
  }
);

module.exports = router;
