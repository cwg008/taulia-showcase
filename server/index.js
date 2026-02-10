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
  message: { error: 'Too many™\]Y\ÝËX\ÙHžHYØZ[ˆ]\‰ÈKŸJNÂ‚˜ÛÛœÝ]][Z]\ˆH˜]S[Z]
ÂˆÚ[™ÝÓ\ÎˆMH
ˆŒ
ˆLˆX^ˆLˆÝ[™\™XY\œÎˆYKˆYØXÞRXY\œÎˆ˜[ÙKˆY\ÜØYÙNˆÈ\œ›ÜŽˆ	ÕÛÈX[žH]][XØ][Ûˆ][\ËX\ÙHžHYØZ[ˆ]\‰ÈKŸJNÂ‚˜\\ÙJ[Ü™Ø[Š\Ô›ÙXÝ[ÛˆÈ	ØÛÛXš[™Y	Èˆ	Ù]‰ÊJNÂ˜\\ÙJÛÛÚÚYT\œÙ\Š
JNÂ˜\\ÙJ^™\ÜËšœÛÛŠÈ[Z]ˆ	Ì[X‰ÈJJNÂ˜\\ÙJ^™\ÜË\›[˜ÛÙY
È^[™YˆYK[Z]ˆ	Ì[X‰ÈJJNÂ˜\\ÙJ^™\ÜËœ˜]ÊÈ\Nˆ	Ø\XØ][Û‹ÛØÝ]\Ý™X[IË[Z]ˆ	ÌLX‰ÈJJNÂ‚‹ËÈ]]˜]H[Z]\ˆ›Üˆ[š]H[™Ú[Â˜ÛÛœÝ[š]S[Z]\ˆH˜]S[Z]
ÂˆÚ[™ÝÓ\ÎˆMH
ˆŒ
ˆLˆX^ˆŒˆÝ[™\™XY\œÎˆYKˆYØXÞRXY\œÎˆ˜[ÙKˆY\ÜØYÙNˆÈ\œ›ÜŽˆ	ÕÛÈX[žH™\]Y\ÝËX\ÙHžHYØZ[ˆ]\‰ÈKŸJNÂ‚‹ËÈ˜]H[Z]\ˆ›Üˆ›ÜÜXÝÜX›XÈ[™Ú[Â˜ÛÛœÝX›XÓ[Z]\ˆH˜]S[Z]
ÂˆÚ[™ÝÓ\ÎˆMH
ˆŒ
ˆLˆX^ˆÌˆÝ[™\™XY\œÎˆYKˆYØXÞRXY\œÎˆ˜[ÙKˆY\ÜØYÙNˆÈ\œ›ÜŽˆ	ÕÛÈX[žH™\]Y\ÝËX\ÙHžHYØZ[ˆ]\‰ÈKŸJNÂ‚‹ËÈ\‹RT˜]H[Z]\ˆ›Üˆ™YY˜XÚÈÝX›Z\ÜÚ[Ûˆ
ÝšXÝ\ŠB˜ÛÛœÝ™YY˜XÚÓ[Z]\ˆH˜]S[Z]
ÂˆÚ[™ÝÓ\ÎˆŒ
ˆŒ
ˆLËÈHÝ\‚ˆX^ˆLËÈL™YY˜XÚÈÝX›Z\ÜÚ[ÛœÈ\ˆÝ\ˆ\ˆTˆÝ[™\™XY\œÎˆYKˆYØXÞRXY\œÎˆ˜[ÙKˆY\ÜØYÙNˆÈ\œ›ÜŽˆ	ÕÛÈX[žH™YY˜XÚÈÝX›Z\ÜÚ[ÛœËˆX\ÙHžHYØZ[ˆ]\‹‰ÈKŸJNÂ‚‹ËÈ\H˜]H[Z]\œÂ˜\\ÙJ	ËØ\KØ]]ÛÙÚ[‰Ë]][Z]\ŠNÂ˜\\ÙJ	ËØ\KØ]]ØXØÙ\Z[š]IË[š]S[Z]\ŠNÂ˜\\ÙJ	ËØ\KØ]]Ý˜[Y]KZ[š]IË[š]S[Z]\ŠNÂ˜\\ÙJ	ËØ\KÜ›ÜÜXÝ	ËX›XÓ[Z]\ŠNÂ˜\\ÙJ	ËØ\KÜ›ÜÜXÝÊ‹Ù™YY˜XÚÉË™YY˜XÚÓ[Z]\ŠNÂ˜\\ÙJ	ËØ\KÝšY]Ù\‰ËX›XÓ[Z]\ŠNÂ˜\\ÙJ	ËØ\IËÙ[™\˜[[Z]\ŠNÂ‚‹ËÈTH›Ý]\Â˜\\ÙJ	ËØ\KØ]]	Ë]]›Ý]\ŠNÂ˜\\ÙJ	ËØ\KØYZ[‰ËYZ[”›Ý]\ŠNÂ˜\\ÙJ	ËØ\KÜ›ÝÝ\\ÉË›ÝÝ\\Ô›Ý]\ŠNÂ˜\\ÙJ	ËØ\KÛ[šÜÉËXYÚXÓ[šÜÔ›Ý]\ŠNÂ˜\\ÙJ	ËØ\KÝšY]Ù\‰ËšY]Ù\”›Ý]\ŠNÂ˜\\ÙJ	ËØ\KÜ›ÜÜXÝ	Ë›ÜÜXÝ›Ý]\ŠNÂ˜\\ÙJ	ËØ\KÝšY]Ù\‹Y\Ú›Ø\™	ËšY]Ù\‘\Ú›Ý]\ŠNÂ‚‹ËÈ›ÈÛ™Ù\ˆÙ\š[™È\ØYÈ\™XÝHHš[\ÈÙ\™YÛ›H›ÝYÚ]][XØ]YšY]Ù\ˆ›Ý]B‚‹ËÈÙ\™HÝ]XÈÛY[š[\È[ˆ›ÙXÝ[Û‚šYˆ
\Ô›ÙXÝ[ÛŠHÂˆ\\ÙJ^™\ÜËœÝ]XÊ]š›Ú[Š×Ù\›˜[YK	ÜX›XÉÊJJNÂˆ\™Ù]
	Ê‰Ë
™\K™\ÊHOˆÂˆYˆ
\™\Kœ]œÝ\ÕÚ]
	ËØ\IÊH	‰ˆ\™\Kœ]œÝ\ÕÚ]
	ËÝ\ØYÉÊJHÂˆ™\ËœÙ[™š[J]š›Ú[Š×Ù\›˜[YK	ÜX›XÉË	Ú[™^š[	ÊJNÂˆBˆJNÂŸB‚‹ËÈ\œ›Üˆ[™\‚˜\\ÙJ\œ›Ü’[™\ŠNÂ‚˜ÛÛœÝÔ•H›ØÙ\ÜË™[‹”Ô•ÌNÂ˜ÛÛœÝÔÕH›ØÙ\ÜË™[‹’ÔÕ	ÌŒŒŒ	ÎÂ‚‹ËÈ[ˆ]X˜\ÙHZYÜ˜][ÛœÈ[™ÙYYÈ™Y›Ü™HÝ\[™ÈÙ\™\‚˜\Þ[˜È[˜Ý[ÛˆÝ\Ù\™\Š
HÂˆžHÂˆÛÛœÛÛK›ÙÊ	Ô[›š[™È]X˜\ÙHZYÜ˜][ÛœË‹‹‰ÊNÂˆ]ØZ]‹›ZYÜ˜]K›]\Ý

NÂˆÛÛœÛÛK›ÙÊ	ÓZYÜ˜][ÛœÈÛÛ\]K‰ÊNÂ‚ˆÛÛœÛÛK›ÙÊ	Ô[›š[™È]X˜\ÙHÙYYË‹‹‰ÊNÂˆ]ØZ]‹œÙYYœ[Š
NÂˆÛÛœÛÛK›ÙÊ	ÔÙYYÈÛÛ\]K‰ÊNÂ‚ˆ\›\Ý[ŠÔ•ÔÕ

HOˆÂˆÛÛœÛÛK›ÙÊ][XHÚÝØØ\ÙHÙ\™\ˆ[›š[™ÈÛˆ	ÒÔÕN‰ÔÔ•X
NÂˆJNÂˆHØ]Ú
\œŠHÂˆÛÛœÛÛK™\œ›ÜŠ	Ñ˜Z[YÈ[š]X[^™H]X˜\ÙN‰Ë\œŠNÂˆ›ØÙ\ÜË™^]
JNÂˆBŸB‚œÝ\Ù\™\Š
NÂ‚›[Ù[K™^ÜÈHÈ\ˆNÂ