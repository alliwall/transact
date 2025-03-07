const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendInvitationCodeEmail } = require("../services/emailService");
const crypto = require("crypto");

// Admin login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await db.query(
      "SELECT id, email, password_hash FROM admin_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Get all invitation requests
const getInvitationRequests = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM invitation_requests ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching invitation requests:", error);
    res.status(500).json({ error: "Failed to fetch invitation requests" });
  }
};

// Generate a random invitation code with the specified prefix
const generateInvitationCode = (prefix) => {
  const randomBytes = crypto.randomBytes(8).toString("hex");
  return `${prefix}${randomBytes.substring(0, 10)}`;
};

// Approve an invitation request
const approveInvitationRequest = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  if (!type || !["A", "B", "C"].includes(type)) {
    return res
      .status(400)
      .json({ error: "Valid type (A, B, or C) is required" });
  }

  try {
    // Begin transaction
    await db.query("BEGIN");

    // Get the request details
    const requestResult = await db.query(
      "SELECT * FROM invitation_requests WHERE id = $1",
      [id]
    );

    if (requestResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Invitation request not found" });
    }

    const request = requestResult.rows[0];

    // Generate a new invitation code
    const code = generateInvitationCode(type);

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert the new invitation code
    await db.query(
      `INSERT INTO invitation_codes 
       (code, type, email, telegram_handle, name, country, daily_volume, referral_source, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        code,
        type,
        request.email,
        request.telegram_handle,
        request.name,
        request.country,
        request.daily_volume,
        request.referral_source,
        expiresAt,
      ]
    );

    // Update the request status
    await db.query(
      `UPDATE invitation_requests 
       SET status = 'approved', processed_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    // Commit transaction
    await db.query("COMMIT");

    // Send email with the invitation code
    await sendInvitationCodeEmail(request, code);

    res.status(200).json({
      message: "Invitation request approved successfully",
      code,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error approving invitation request:", error);
    res.status(500).json({ error: "Failed to approve invitation request" });
  }
};

// Reject an invitation request
const rejectInvitationRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE invitation_requests 
       SET status = 'rejected', processed_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitation request not found" });
    }

    res.status(200).json({
      message: "Invitation request rejected successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Error rejecting invitation request:", error);
    res.status(500).json({ error: "Failed to reject invitation request" });
  }
};

// Get all active invitation codes
const getInvitationCodes = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM invitation_codes ORDER BY created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching invitation codes:", error);
    res.status(500).json({ error: "Failed to fetch invitation codes" });
  }
};

// Revoke an invitation code
const revokeInvitationCode = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE invitation_codes 
       SET is_active = FALSE 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitation code not found" });
    }

    res.status(200).json({
      message: "Invitation code revoked successfully",
      code: result.rows[0],
    });
  } catch (error) {
    console.error("Error revoking invitation code:", error);
    res.status(500).json({ error: "Failed to revoke invitation code" });
  }
};

module.exports = {
  login,
  getInvitationRequests,
  approveInvitationRequest,
  rejectInvitationRequest,
  getInvitationCodes,
  revokeInvitationCode,
};
