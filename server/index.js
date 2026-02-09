const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const { db } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const auditLog = require('./middleware/auditLog');

const app = express();

// Trust proxy (needed for Railway, Render, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL || true)
    : clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500,
  message: { error: 'Too many attempts. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Serve uploaded prototypes (for admin preview - auth checked in route)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Audit logging on sensitive routes
app.use('/api/auth', auditLog);
app.use('/api/admin', auditLog);
app.use('/api/prototypes', auditLog);
app.use('/api/links', auditLog);
app.use('/api/prospect', auditLog);

// Rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const prototypeRoutes = require('./routes/prototypes');
const magicLinkRoutes = require('./routes/magicLinks');
const viewerRoutes = require('./routes/viewer');
const prospectRoutes = require('./routes/prospect');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/links', magicLinkRoutes);
app.use('/api/viewer', viewerRoutes);
app.use('/api/prospect', prospectRoutes);

// Serve React frontend in production
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Error handling
app.use(errorHandler);

// Database migration and startup
async function startServer() {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log('Database migrations completed');

    // Run seeds in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        await db.seed.run();
        console.log('Database seeded');
      } catch (seedErr) {
        console.log('Seed skipped or already applied');
      }
    }

    app.listen(PORT, HOST, () => {
      console.log(`Taulia Prototype Showcase running on ${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
