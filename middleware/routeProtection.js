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

// Protected routes
router.get("/business-payment", requireInvitation, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/business-payment.html"));
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
  "/payment-url-gen",
  requireInvitation,
  requireFeature("payment_url_gen"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/payment-url-gen.html"));
  }
);

module.exports = router;
