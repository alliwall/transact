const db = require("../config/database");
const {
  sendInvitationRequestNotification,
} = require("../services/emailService");

// Submit a request for an invitation code
const submitInvitationRequest = async (req, res) => {
  const {
    email,
    telegram_handle,
    name,
    country,
    daily_volume,
    referral_source,
  } = req.body;

  // Validate required fields
  if (!email || !telegram_handle) {
    return res
      .status(400)
      .json({ error: "Email and Telegram handle are required" });
  }

  try {
    // Insert the request into the database
    const result = await db.query(
      `INSERT INTO invitation_requests 
       (email, telegram_handle, name, country, daily_volume, referral_source) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [email, telegram_handle, name, country, daily_volume, referral_source]
    );

    // Send notification email to admin
    await sendInvitationRequestNotification({
      email,
      telegram_handle,
      name,
      country,
      daily_volume,
      referral_source,
    });

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

  if (!code) {
    return res.status(400).json({ error: "Invitation code is required" });
  }

  try {
    // Check if the code exists and is active
    const result = await db.query(
      `SELECT id, code, type, expires_at, is_active 
       FROM invitation_codes 
       WHERE code = $1`,
      [code]
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

    // Update last used timestamp
    await db.query(
      `UPDATE invitation_codes SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [invitationCode.id]
    );

    // Return the features this code unlocks based on its type
    let features = [];
    switch (invitationCode.type) {
      case "A":
        features = ["generate_payment_link"];
        break;
      case "B":
        features = ["payment_url_gen"];
        break;
      case "C":
        features = ["generate_payment_link", "payment_url_gen"];
        break;
    }

    // Set a session cookie with the code information
    if (!req.session) {
      console.error("Session object not available");
      return res.status(500).json({ error: "Session initialization failed" });
    }

    // Explicitly set the invitation in the session
    req.session.invitation = {
      code: invitationCode.code,
      type: invitationCode.type,
      features,
    };

    // Force session regeneration to ensure it's properly saved
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
        return res.status(500).json({ error: "Failed to regenerate session" });
      }
      
      // Set the invitation data again in the new session
      req.session.invitation = {
        code: invitationCode.code,
        type: invitationCode.type,
        features,
      };
      
      // Ensure the session is saved before responding
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }

        res.status(200).json({
          message: "Invitation code verified successfully",
          type: invitationCode.type,
          features,
          sessionId: req.sessionID // Include session ID in response for debugging
        });
      });
    });
  } catch (error) {
    console.error("Error verifying invitation code:", error);
    res.status(500).json({ error: "Failed to verify invitation code" });
  }
};

module.exports = {
  submitInvitationRequest,
  verifyInvitationCode,
};
