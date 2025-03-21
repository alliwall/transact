const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendInvitationCodeEmail } = require("../services/emailService");
const crypto = require("crypto");

// Simple in-memory rate limiting for login attempts
// In production, use a proper rate limiting solution like redis-rate-limiter
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Admin login with rate limiting and improved security
const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // Check for rate limiting
  const ipKey = `${ip}:${email || "unknown"}`;
  const currentTime = Date.now();
  const attemptData = loginAttempts.get(ipKey) || { count: 0, lockUntil: 0 };

  // Check if IP is locked out
  if (attemptData.lockUntil > currentTime) {
    const waitMinutes = Math.ceil(
      (attemptData.lockUntil - currentTime) / 60000
    );
    return res.status(429).json({
      error: `Too many failed login attempts. Please try again in ${waitMinutes} minutes.`,
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await db.query(
      "SELECT id, email, password_hash FROM admin_users WHERE email = $1",
      [email]
    );

    // Use constant-time comparison to prevent timing attacks
    // Always verify against a hash even if user doesn't exist
    let passwordMatch = false;
    let user = null;

    if (result.rows.length > 0) {
      user = result.rows[0];
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // If user doesn't exist, do a dummy comparison to prevent timing attacks
      await bcrypt.compare(password, "$2b$10$" + "X".repeat(53));
    }

    // Handle failed login attempt
    if (!passwordMatch) {
      // Increment attempt counter
      attemptData.count += 1;

      // Check if max attempts reached
      if (attemptData.count >= MAX_LOGIN_ATTEMPTS) {
        attemptData.lockUntil = currentTime + LOCKOUT_TIME;
        attemptData.count = 0;
      }

      loginAttempts.set(ipKey, attemptData);

      // Use the same error message regardless of whether the email exists
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    loginAttempts.delete(ipKey);

    // Generate JWT token with appropriate expiration
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
        algorithm: "HS256", // Explicitly specify the algorithm
      }
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

// Generate a secure random invitation code with the specified prefix
const generateInvitationCode = (prefix) => {
  // Use crypto for secure random generation
  const randomBytes = crypto.randomBytes(16).toString("hex");
  // Format: PREFIX-RANDOM-CHECKSUM
  const code = `${prefix}-${randomBytes.substring(0, 10)}`;

  // Add a simple checksum for basic validation
  let checksum = 0;
  for (let i = 0; i < code.length; i++) {
    checksum = (checksum + code.charCodeAt(i)) % 10;
  }

  return `${code}-${checksum}`;
};

// Approve an invitation request
const approveInvitationRequest = async (req, res) => {
  const { id } = req.params;
  const { type, expiresAt } = req.body;

  // Validate request ID
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "Valid request ID is required" });
  }

  // Validate invitation type
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
      "SELECT * FROM invitation_requests WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (requestResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(422).json({ error: "Invitation request not found" });
    }

    const request = requestResult.rows[0];

    // Check if request is already processed
    if (request.status !== "pending") {
      await db.query("ROLLBACK");
      return res.status(409).json({
        error: `Invitation request already ${request.status}`,
        status: request.status,
      });
    }

    // Generate a new invitation code
    const code = generateInvitationCode(type);

    // Use provided expiration date or default to 30 days
    let expirationDate = null;

    if (expiresAt === null) {
      // Never expires
      expirationDate = null;
    } else if (expiresAt) {
      // Use provided date
      expirationDate = new Date(expiresAt);
    } else {
      // Default: 30 days
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Insert the new invitation code
    const codeResult = await db.query(
      `INSERT INTO invitation_codes 
       (code, type, email, telegram_handle, whatsapp, name, country, daily_volume, referral_source, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        code,
        type,
        request.email,
        request.telegram_handle,
        request.whatsapp,
        request.name,
        request.country,
        request.daily_volume,
        request.referral_source,
        expirationDate,
      ]
    );

    // Update the request status
    await db.query(
      `UPDATE invitation_requests 
       SET status = 'approved', processed_at = CURRENT_TIMESTAMP, 
           processed_by = $1, invitation_code_id = $2
       WHERE id = $3`,
      [req.user.id, codeResult.rows[0].id, id]
    );

    // Commit transaction
    await db.query("COMMIT");

    // Send email with the invitation code
    try {
      await sendInvitationCodeEmail(request, code);
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending invitation email:", emailError);
    }

    res.status(200).json({
      message: "Invitation request approved successfully",
      code,
      expires_at: expirationDate,
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
  const { reason } = req.body;

  // Validate request ID
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "Valid request ID is required" });
  }

  try {
    // Begin transaction
    await db.query("BEGIN");

    // Get the request with a lock
    const checkResult = await db.query(
      `SELECT status FROM invitation_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(422).json({ error: "Invitation request not found" });
    }

    // Check if request is already processed
    if (checkResult.rows[0].status !== "pending") {
      await db.query("ROLLBACK");
      return res.status(409).json({
        error: `Invitation request already ${checkResult.rows[0].status}`,
        status: checkResult.rows[0].status,
      });
    }

    // Update the request status
    const result = await db.query(
      `UPDATE invitation_requests 
       SET status = 'rejected', 
           processed_at = CURRENT_TIMESTAMP, 
           processed_by = $1,
           rejection_reason = $2
       WHERE id = $3 
       RETURNING *`,
      [req.user.id, reason || null, id]
    );

    // Commit transaction
    await db.query("COMMIT");

    res.status(200).json({
      message: "Invitation request rejected successfully",
      request: result.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
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
      return res.status(422).json({ error: "Invitation code not found" });
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

// Reactivate an expired invitation code
const reactivateInvitationCode = async (req, res) => {
  const { id } = req.params;
  const { expiresAt } = req.body;

  try {
    // Begin transaction
    await db.query("BEGIN");

    // Get the code with a lock
    const checkResult = await db.query(
      `SELECT * FROM invitation_codes WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(422).json({ error: "Invitation code not found" });
    }

    const code = checkResult.rows[0];

    // Check if code can be reactivated
    if (!code.is_active) {
      await db.query("ROLLBACK");
      return res.status(409).json({
        error: "Cannot reactivate a revoked code",
      });
    }

    // Use provided expiration date or calculate default (30 days)
    let expirationDate = null;

    if (expiresAt === null) {
      // Never expires
      expirationDate = null;
    } else if (expiresAt) {
      // Use provided date
      expirationDate = new Date(expiresAt);
    } else {
      // Default: 30 days from now
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Update the invitation code with new expiration date
    const result = await db.query(
      `UPDATE invitation_codes 
       SET expires_at = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [expirationDate, id]
    );

    // Commit transaction
    await db.query("COMMIT");

    res.status(200).json({
      message: "Invitation code reactivated successfully",
      code: result.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error reactivating invitation code:", error);
    res.status(500).json({ error: "Failed to reactivate invitation code" });
  }
};

module.exports = {
  login,
  getInvitationRequests,
  approveInvitationRequest,
  rejectInvitationRequest,
  getInvitationCodes,
  revokeInvitationCode,
  reactivateInvitationCode,
};
