require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const prototypesRouter = require('./routes/prototypes');
const magicLinksRouter = require('./routes/magicLinks');
const viewerRouter = require('./routes/viewer');
const prospectRouter = require('./routes/prospect');
const viewerDashRouter = require('./routes/viewerRoutes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Enforce critical environment variables in production
if (isProduction) {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is required in production');
    process.exit(1);
  }
} else {
  // Set default JWT_SECRET for development if not provided
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'taulia-dev-secret-change-in-production';
  }
}

// HTTPS redirect in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Trust proxy in production
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security middleware - enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// CORS - restrict to specific origin in production
const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'taulia-showcase-production.up.railway.app'}`]
  : [clientUrl];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));

// Auth rate limiter for invite endpoints
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Rate limiter for prospect/public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/accept-invite', inviteLimiter);
app.use('/api/auth/validate-invite', inviteLimiter);
app.use('/api/prospect', publicLimiter);
app.use('/api/viewer', publicLimiter);
app.use('/api', generalLimiter);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/prototypes', prototypesRouter);
app.use('/api/links', magicLinksRouter);
app.use('/api/viewer', viewerRouter);
app.use('/api/prospect', prospectRouter);
app.use('/api/viewer-dashboard', viewerDashRouter);

// No longer serving uploads directly - files served only through authenticated viewer route

// Serve static client files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Run database migrations and seeds before starting server
async function startServer() {
  try {
    console.log('Running database migrations...');
    await db.migrate.latest();
    console.log('Migrations complete.');

    console.log('Running database seeds...');
    await db.seed.run();
    console.log('Seeds complete.');

    app.listen(PORT, HOST, () => {
      console.log(`Taulia Showcase Server running on ${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, db };
