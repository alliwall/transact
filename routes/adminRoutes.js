const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateAdmin } = require("../middleware/auth");

// Admin login route
router.post("/login", adminController.login);

// Protected admin routes
router.get(
  "/invitation-requests",
  authenticateAdmin,
  adminController.getInvitationRequests
);
router.post(
  "/invitation-requests/:id/approve",
  authenticateAdmin,
  adminController.approveInvitationRequest
);
router.post(
  "/invitation-requests/:id/reject",
  authenticateAdmin,
  adminController.rejectInvitationRequest
);
router.get(
  "/invitation-codes",
  authenticateAdmin,
  adminController.getInvitationCodes
);
router.post(
  "/invitation-codes/:id/revoke",
  authenticateAdmin,
  adminController.revokeInvitationCode
);

module.exports = router;
