const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./config/database');
require('dotenv').config();

// Import routes
const invitationRoutes = require('./routes/invitationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { authenticateAdmin, requireInvitation, requireFeature } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
if (process.env.NODE_ENV === 'production') {
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
            "'unsafe-inline'"
          ],
          styleSrc: [
            "'self'", 
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "stackpath.bootstrapcdn.com",
            "fonts.googleapis.com",
            "unpkg.com",
            "'unsafe-inline'"
          ],
          fontSrc: [
            "'self'", 
            "cdn.jsdelivr.net",
            "cdnjs.cloudflare.com",
            "fonts.gstatic.com",
            "fonts.googleapis.com",
            "data:"
          ],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      }
    })
  );
} else {
  // In development, disable Helmet to avoid CSP and SSL issues
  console.log('Development mode: Helmet disabled');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with PostgreSQL storage
app.use(session({
  store: new pgSession({
    pool: db.pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API Routes
app.use('/api/invitation', invitationRoutes);
app.use('/api/admin', adminRoutes);

// Protected page routes - using app.get (not app.use)
app.get('/business-payment', requireInvitation, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/business-payment.html'));
});

app.get('/payment-link', requireInvitation, requireFeature('generate_payment_link'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public/payment-link.html'));
});

app.get('/payment-url-gen', requireInvitation, requireFeature('payment_url_gen'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public/payment-url-gen.html'));
});

// Servir ficheiros estáticos APENAS para pastas públicas específicas
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Public page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/invitation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/invitation.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Session status endpoint for debugging
app.get('/api/session-status', (req, res) => {
  res.json({
    hasSession: !!req.session,
    invitation: req.session ? req.session.invitation : null
  });
});

// 404 route for any undefined routes
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

// Create initial admin user if not exists
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.warn('Admin credentials not provided in .env file');
      return;
    }
    
    const result = await db.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [adminEmail]
    );
    
    if (result.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await db.query(
        'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)',
        [adminEmail, passwordHash]
      );
      
      console.log('Initial admin user created');
    }
  } catch (error) {
    console.error('Error creating initial admin user:', error);
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
    console.error('Error checking for expired invitation codes:', error);
  }
}, 24 * 60 * 60 * 1000); // Run once per day
