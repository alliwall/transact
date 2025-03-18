const db = require("../config/database");
const {
  sendInvitationRequestNotification,
} = require("../services/emailService");
const { escapeHtml } = require("../utils/sanitizer");

// Submit a request for an invitation code
const submitInvitationRequest = async (req, res) => {
  const {
    email,
    telegram_handle,
    whatsapp,
    name,
    country,
    daily_volume,
    referral_source,
  } = req.body;

  // Validate and sanitize inputs
  const sanitizedInputs = {
    email: email ? email.trim().toLowerCase() : null,
    telegram_handle: telegram_handle ? telegram_handle.trim() : null,
    whatsapp: whatsapp ? whatsapp.trim() : null,
    name: name ? escapeHtml(name.trim()) : null,
    country: country ? escapeHtml(country.trim()) : null,
    daily_volume: daily_volume ? escapeHtml(daily_volume.trim()) : null,
    referral_source: referral_source
      ? escapeHtml(referral_source.trim())
      : null,
  };

  // Validate required fields
  if (!sanitizedInputs.email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedInputs.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate Telegram format if provided
  if (
    sanitizedInputs.telegram_handle &&
    !/^[a-zA-Z0-9_]{5,32}$/.test(sanitizedInputs.telegram_handle)
  ) {
    return res.status(400).json({
      error:
        "Telegram handle must be 5-32 characters and contain only letters, numbers, and underscores",
    });
  }

  // Validate WhatsApp format if provided
  if (sanitizedInputs.whatsapp && !/^[+0-9]+$/.test(sanitizedInputs.whatsapp)) {
    return res.status(400).json({
      error:
        "WhatsApp number must contain only numbers and optionally a + sign",
    });
  }

  try {
    // Check if email already has a pending request
    const existingRequest = await db.query(
      `SELECT id, status FROM invitation_requests 
       WHERE email = $1 AND status = 'pending'`,
      [sanitizedInputs.email]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        error: "You already have a pending invitation request",
        request_id: existingRequest.rows[0].id,
      });
    }

    // Insert the request into the database
    const result = await db.query(
      `INSERT INTO invitation_requests 
       (email, telegram_handle, whatsapp, name, country, daily_volume, referral_source) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        sanitizedInputs.email,
        sanitizedInputs.telegram_handle,
        sanitizedInputs.whatsapp,
        sanitizedInputs.name,
        sanitizedInputs.country,
        sanitizedInputs.daily_volume,
        sanitizedInputs.referral_source,
      ]
    );

    // Send notification email to admin
    await sendInvitationRequestNotification(sanitizedInputs);

    res.status(201).json({
      message:
        "Invitation request submitted successfully. We will contact you soon.",
      request_id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error submitting invitation request:", error);
    res.status(500).json({ error: "Failed to submit invitation request" });
  }
};

// Verify an invitation code
const verifyInvitationCode = async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Valid invitation code is required" });
  }

  // Sanitize and normalize the code
  const sanitizedCode = code.trim();

  try {
    // Check if the code exists and is active
    const result = await db.query(
      `SELECT id, code, type, expires_at, is_active, used_count 
       FROM invitation_codes 
       WHERE code = $1`,
      [sanitizedCode]
    );

    if (result.rows.length === 0) {
      return res.status(422).json({ error: "Invalid invitation code" });
    }

    const invitationCode = result.rows[0];

    // Check if the code is active
    if (!invitationCode.is_active) {
      return res
        .status(403)
        .json({ error: "This invitation code has been revoked" });
    }

    // Check if the code has expired
    if (new Date(invitationCode.expires_at) < new Date()) {
      return res
        .status(403)
        .json({ error: "This invitation code has expired" });
    }

    // Begin transaction to update code usage
    await db.query("BEGIN");

    try {
      // Update last used timestamp and increment used count
      await db.query(
        `UPDATE invitation_codes 
         SET last_used_at = CURRENT_TIMESTAMP, 
             used_count = used_count + 1 
         WHERE id = $1`,
        [invitationCode.id]
      );

      // Return the features this code unlocks based on its type
      let features = [];
      switch (invitationCode.type) {
        case "A":
          features = ["generate_payment_link"];
          break;
        case "B":
          features = ["generate_merchant_link"];
          break;
        case "C":
          features = ["generate_payment_link", "generate_merchant_link"];
          break;
        default:
          features = [];
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          db.query("ROLLBACK");
          console.error("Error regenerating session:", err);
          return res
            .status(500)
            .json({ error: "Failed to regenerate session" });
        }

        // Set the invitation data in the new session
        req.session.invitation = {
          code: invitationCode.code,
          type: invitationCode.type,
          features,
          verified_at: new Date().toISOString(),
        };

        // Generate a CSRF token for the session
        req.session.csrfToken = require("crypto")
          .randomBytes(32)
          .toString("hex");

        // Ensure the session is saved before responding
        req.session.save((err) => {
          if (err) {
            db.query("ROLLBACK");
            console.error("Error saving session:", err);
            return res.status(500).json({ error: "Failed to save session" });
          }

          // Commit the transaction
          db.query("COMMIT");

          res.status(200).json({
            message: "Invitation code verified successfully",
            type: invitationCode.type,
            features,
            csrfToken: req.session.csrfToken,
          });
        });
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error verifying invitation code:", error);
    res.status(500).json({ error: "Failed to verify invitation code" });
  }
};

module.exports = {
  submitInvitationRequest,
  verifyInvitationCode,
};
