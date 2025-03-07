const express = require("express");
const router = express.Router();
const invitationController = require("../controllers/invitationController");

// Route to submit a request for an invitation code
router.post("/request", invitationController.submitInvitationRequest);

// Route to verify an invitation code
router.post("/verify", invitationController.verifyInvitationCode);

module.exports = router;
