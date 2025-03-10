const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./config/database");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

// Import routes
const invitationRoutes = require("./routes/invitationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {
  requireInvitation,
  requireFeature,
  isValidWalletData,
} = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy if in production (important for secure cookies behind proxies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Simple rate limiting middleware
const createRateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean up old entries
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const userRequests = requests
      .get(ip)
      .filter((time) => now - time < windowMs);
    requests.set(ip, userRequests);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests, please try again later.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    userRequests.push(now);
    requests.set(ip, userRequests);
    next();
  };
};

// Apply rate limiting to all requests
app.use(createRateLimiter(60 * 1000, 60)); // 60 requests per minute

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
if (process.env.NODE_ENV === "production") {
  // In production, use a secure Helmet configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "code.jquery.com",
            "stackpath.bootstrapcdn.com",
            "unpkg.com",
            "'unsafe-inline'",
          ],
          styleSrc: [
            "'self'",
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "stackpath.bootstrapcdn.com",
            "fonts.googleapis.com",
            "unpkg.com",
            "'unsafe-inline'",
          ],
          fontSrc: [
            "'self'",
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "fonts.gstatic.com",
            "fonts.googleapis.com",
            "data:",
          ],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: [
            "'self'",
            "https://paygate.to",
            "api.transact.st",
            "payment.transact.st",
            "https://api.transact.st",
            "https://payment.transact.st",
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // Enable additional security headers
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Configuration CORS for production
  app.use(
    cors({
      origin: process.env.APP_URL || true, // Use APP_URL from env or allow same origin
      credentials: true, // Important: allows sending cookies
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
} else {
  // In development, disable Helmet to avoid CSP and SSL issues
  console.log("Development mode: Helmet disabled");

  // CORS configuration for development
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Check CSRF token in headers
  const csrfToken = req.headers["x-csrf-token"];

  if (!csrfToken || csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: "CSRF token validation failed" });
  }

  next();
};

// Generate CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  if (!req.session.csrfToken) {
    // Generate a random token
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.json({ csrfToken: req.session.csrfToken });
});

// Session configuration with PostgreSQL storage
app.use(
  session({
    store: new pgSession({
      pool: db.pool,
      tableName: "session",
      // Add schema if needed
      schemaName: process.env.DB_SCHEMA || "public",
      // Add column mapping if needed
      columns: {
        session_id: "sid",
        session_data: "sess",
        expire: "expire",
      },
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    name: "transact.sid", // Custom name to avoid conflicts
    rolling: true, // Reset expiration on activity
  })
);

// Apply CSRF protection to all non-GET routes
app.use(csrfProtection);

// Remove session debugging middleware that logs sensitive data
// Add production-safe request logging
app.use((req, res, next) => {
  // Only log non-sensitive information
  const cleanUrl = req.url.replace(/\?.*$/, "?[REDACTED]"); // Redact query parameters
  console.log(
    `${new Date().toISOString()} - ${req.method} ${cleanUrl} - IP: ${req.ip}`
  );
  next();
});

// API Routes
app.use("/api/invitation", invitationRoutes);
app.use("/api/admin", adminRoutes);

// Protected page routes - using app.get (not app.use)
app.get("/merchant-payment", requireInvitation, (req, res) => {
  res.sendFile(path.join(__dirname, "public/merchant-payment.html"));
});

app.get(
  "/payment-link",
  requireInvitation,
  requireFeature("generate_payment_link"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "public/payment-link.html"));
  }
);

app.get(
  "/generate-merchant-link",
  requireInvitation,
  requireFeature("generate_merchant_link"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "public/generate-merchant-link.html"));
  }
);

// Servir ficheiros estáticos APENAS para pastas públicas específicas
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Public page routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/invitation", (req, res) => {
  res.sendFile(path.join(__dirname, "public/invitation.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// Session status endpoint for debugging
app.get("/api/session-status", (req, res) => {
  res.json({
    hasSession: !!req.session,
    invitation: req.session ? req.session.invitation : null,
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
});

// Test endpoint to set a value in the session
app.get("/api/session-test", (req, res) => {
  if (!req.session) {
    return res.status(500).json({ error: "Session not initialized" });
  }

  // Set a test value in the session
  req.session.testValue = new Date().toISOString();

  // Save the session
  req.session.save((err) => {
    if (err) {
      console.error("Error saving session:", err);
      return res.status(500).json({ error: "Failed to save session" });
    }

    res.json({
      message: "Test value set in session",
      testValue: req.session.testValue,
      sessionID: req.sessionID,
    });
  });
});

// Wallet data validation test endpoint
app.get("/api/validate-wallet-data", (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: "No data parameter provided" });
  }

  try {
    // Validate the data
    const isValid = isValidWalletData(data);

    res.json({
      data,
      isValid,
      decodedData: decodeURIComponent(data),
    });
  } catch (error) {
    console.error("Error validating wallet data:", error);
    res.status(500).json({ error: "Failed to validate wallet data" });
  }
});

// Ping endpoint to keep the application alive on Render
app.get("/api/ping", (req, res) => {
  console.log(`Ping received at ${new Date().toISOString()}`);
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 route for any undefined routes
app.use("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public/404.html"));
});

// Create initial admin user if not exists
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("Admin credentials not provided in .env file");
      return;
    }

    const result = await db.query(
      "SELECT id FROM admin_users WHERE email = $1",
      [adminEmail]
    );

    if (result.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await db.query(
        "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
        [adminEmail, passwordHash]
      );

      console.log("Initial admin user created");
    }
  } catch (error) {
    console.error("Error creating initial admin user:", error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createInitialAdmin();
});

// Scheduled task to check for expired invitation codes
setInterval(async () => {
  try {
    await db.query(
      `UPDATE invitation_codes 
       SET is_active = FALSE 
       WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE`
    );
  } catch (error) {
    console.error("Error checking for expired invitation codes:", error);
  }
}, 24 * 60 * 60 * 1000); // Run once per day

// Scheduled task to ping the server with randomized intervals to prevent Render from sleeping
const scheduleSelfPing = () => {
  // Use environment variables for configuration with sensible defaults
  const minInterval = parseInt(process.env.PING_MIN_INTERVAL_MINUTES || "4");
  const maxInterval = parseInt(process.env.PING_MAX_INTERVAL_MINUTES || "13");

  // Validate configuration
  if (minInterval >= maxInterval) {
    console.warn(
      `Invalid ping interval configuration: min=${minInterval}, max=${maxInterval}. Using defaults.`
    );
  }

  // Generate a random interval between min and max minutes (in milliseconds)
  const randomInterval =
    (Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
      minInterval) *
    60 *
    1000;
  const nextPingTime = new Date(Date.now() + randomInterval);

  console.log(
    `Next self-ping scheduled at ${nextPingTime.toISOString()} (in ${
      randomInterval / 60000
    } minutes)`
  );

  setTimeout(async () => {
    try {
      const appUrl = process.env.APP_URL;

      if (!appUrl) {
        throw new Error("APP_URL environment variable is not set");
      }

      console.log(`Self-pinging application at ${new Date().toISOString()}`);

      // Set timeout for the request to prevent hanging
      const response = await axios.get(`${appUrl}/api/ping`, {
        timeout: 10000, // 10 second timeout
        headers: {
          "User-Agent": "TransactSelfPing/1.0",
        },
      });

      console.log(`Self-ping response: ${response.status}`);
    } catch (error) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          `Self-ping error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error(
          `Self-ping error: No response received - ${error.message}`
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`Self-ping error: ${error.message}`);
      }
    } finally {
      // Always schedule the next ping, even if this one failed
      scheduleSelfPing();
    }
  }, randomInterval);
};

// Start the first ping cycle if APP_URL is set
if (process.env.APP_URL) {
  scheduleSelfPing();
} else {
  console.warn("APP_URL environment variable is not set. Self-ping disabled.");
}
