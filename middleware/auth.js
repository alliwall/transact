const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware to verify JWT token for admin routes
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
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
    req.path.startsWith("/api/") ||
    req.path.startsWith("/css/") ||
    req.path.startsWith("/js/") ||
    req.path.startsWith("/images/")
  ) {
    console.log("Skipping auth check for public path:", req.path);
    return next();
  }

  // Check if user has a valid invitation in session
  if (!req.session || !req.session.invitation) {
    // Capture the full original URL (including path and query parameters)
    const originalUrl = req.originalUrl;

    // Log the redirection
    console.log(
      `No invitation found, redirecting to invitation page with redirect to: ${originalUrl}`
    );

    // Redirect to invitation page with original URL as redirect_url parameter
    return res.redirect(
      `/invitation?redirect_url=${encodeURIComponent(originalUrl)}`
    );
  }

  // User has valid invitation, proceed
  console.log("Valid invitation found, proceeding to:", req.path);
  console.log("Invitation details:", req.session.invitation);

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
    req.path.includes("/payment-url-gen") &&
    !features.includes("payment_url_gen")
  ) {
    hasPermission = false;
  }

  if (!hasPermission) {
    console.log("Permission denied for path:", req.path);
    console.log("User features:", features);
    
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
    console.log(`Checking feature access for: ${feature}`);
    console.log("Session:", req.session);

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
};
