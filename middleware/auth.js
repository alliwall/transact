const jwt = require("jsonwebtoken");
require("dotenv").config();
// Replace hardcoded encryption key with environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

// Ensure encryption key is set
if (!ENCRYPTION_KEY) {
  console.error(
    "WARNING: ENCRYPTION_KEY environment variable is not set. This is a security risk!"
  );
}

function validateWalletAddress(address) {
  // Simple validation for Ethereum-style addresses
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
// Advanced decryption function to match new encryption methods
function isValidWalletData(encryptedData) {
  try {
    // Convert from URL-safe base64 back to regular base64
    let base64 = encryptedData.replace(/-/g, "+").replace(/_/g, "/");

    // Add back any missing padding (=)
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode base64
    const decoded = atob(base64);

    // Check if this is the fallback format (starts with F1:)
    if (decoded.startsWith("F1:")) {
      // Handle fallback format
      const parts = decoded.split(":");
      if (parts.length !== 4) {
        throw new Error("Invalid encrypted data format");
      }

      const salt = parts[1];
      const integrityCheckHex = parts[2];
      const encrypted = parts[3];

      // Recreate the full key
      const fullKey = ENCRYPTION_KEY + salt;

      // Multiple rounds of decryption (reverse of encryption)
      let decrypted = encrypted;
      for (let round = 2; round >= 0; round--) {
        let roundResult = "";
        for (let i = 0; i < decrypted.length; i++) {
          // Reverse the complex XOR pattern
          const keyChar = fullKey.charCodeAt((i * round + i) % fullKey.length);
          const prevChar = i > 0 ? decrypted.charCodeAt(i - 1) : 0;
          const charCode = decrypted.charCodeAt(i) ^ keyChar ^ (prevChar >> 3);
          roundResult += String.fromCharCode(charCode);
        }
        decrypted = roundResult;
      }

      // Verify integrity check
      let calculatedCheck = 0;
      for (let i = 0; i < decrypted.length; i++) {
        calculatedCheck =
          (calculatedCheck * 31 + decrypted.charCodeAt(i)) >>> 0;
      }

      if (calculatedCheck.toString(16) !== integrityCheckHex) {
        console.error("Integrity check failed");
        return null;
      }

      // Validate wallet address format
      if (validateWalletAddress(decrypted)) {
        return decrypted;
      } else {
        console.error("Decrypted value is not a valid wallet address");
        return null;
      }
    } else {
      // Handle sophisticated format (binary data)
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // Extract components
      const salt = bytes.slice(0, 16);
      const integrity = bytes.slice(16, 48);
      const encrypted = bytes.slice(48);

      // Recreate the key
      const encoder = new TextEncoder();
      const key = encoder.encode(ENCRYPTION_KEY);

      // Initialize S-box (same as in encryption)
      const sBox = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        sBox[i] = i;
      }

      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + sBox[i] + key[i % key.length] + salt[i % salt.length]) % 256;
        [sBox[i], sBox[j]] = [sBox[j], sBox[i]]; // Swap
      }

      // Decrypt the data
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        const a = (i + 1) % 256;
        const b = (sBox[a] + sBox[i % 256]) % 256;
        [sBox[a], sBox[b]] = [sBox[b], sBox[a]]; // Swap
        const k = sBox[(sBox[a] + sBox[b]) % 256];
        decrypted[i] = encrypted[i] ^ k;
      }

      // Verify integrity
      const calculatedIntegrity = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        let value = salt[i % salt.length];
        for (let j = 0; j < decrypted.length; j++) {
          value ^= decrypted[j];
          value = ((value << 1) | (value >> 7)) & 0xff; // Rotate left
        }
        calculatedIntegrity[i] = value;
      }

      // Compare integrity values
      let integrityMatch = true;
      for (let i = 0; i < 32; i++) {
        if (integrity[i] !== calculatedIntegrity[i]) {
          integrityMatch = false;
          break;
        }
      }

      if (!integrityMatch) {
        console.error("Integrity check failed");
        return null;
      }

      // Convert decrypted bytes to string
      const decoder = new TextDecoder();
      const walletAddress = decoder.decode(decrypted);

      // Validate wallet address format
      if (validateWalletAddress(walletAddress)) {
        return walletAddress;
      } else {
        console.error("Decrypted value is not a valid wallet address");
        return null;
      }
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

// Improved JWT authentication middleware with better error handling
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration explicitly
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      return res.status(401).json({ error: "Token expired." });
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    } else {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Token validation failed." });
    }
  }
};

/**
 * Middleware to check if user has a valid invitation
 * Redirects to invitation page with original URL if no valid invitation exists
 */
const requireInvitation = (req, res, next) => {
  // Skip public routes and static assets
  if (
    req.path === "/invitation" ||
    req.path === "/" ||
    req.path === "/merchant-payment" ||
    req.path.startsWith("/api/") ||
    req.path.startsWith("/css/") ||
    req.path.startsWith("/js/") ||
    req.path.startsWith("/images/")
  ) {
    return next();
  }

  // Special case for merchant-payment with valid data parameter
  if (req.path === "/merchant-payment" && req.query.waddr) {
    // Check if the data parameter contains a valid wallet
    if (isValidWalletData(req.query.waddr)) {
      // Valid wallet data detected, bypassing invitation requirement
      return next();
    } else {
      // Invalid wallet data, continuing with normal invitation check
    }
  }

  // Check if user has a valid invitation in session
  if (!req.session || !req.session.invitation) {
    // Capture the full original URL (including path and query parameters)
    const originalUrl = req.originalUrl;

    // Redirect to invitation page with original URL as redirect_url parameter
    return res.redirect(
      `/invitation?redirect_url=${encodeURIComponent(originalUrl)}`
    );
  }

  // Check if user has permission for this path based on features
  const features = req.session.invitation.features || [];
  let hasPermission = true;

  // Path-based permission checks
  if (
    req.path.includes("/payment-link") &&
    !features.includes("generate_payment_link")
  ) {
    hasPermission = false;
  } else if (
    req.path.includes("/generate-merchant-link") &&
    !features.includes("generate_merchant_link")
  ) {
    hasPermission = false;
  }

  if (!hasPermission) {
    // Store error message in session for display
    req.session.invitationError =
      "Your invitation code does not grant access to this feature";
    //return res.redirect('/');
  }

  // User has valid invitation with appropriate permissions
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
      console.log(`Access denied for feature: ${feature}`);

      return res.redirect(`/`);
    }

    console.log(`Access granted for feature: ${feature}`);
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requireInvitation,
  requireFeature,
  isValidWalletData,
};
