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
  referrerPolicy:{ policy: ÍÑÉ¥Ðµ½É¥¥¸µÝ¡•¸µÉ½ÍÌµ½É¥¥¸œô°(€áÍÍ¥±Ñ•ÈèÑÉÕ”°)ô¤¤ì((¼¼=IL€´É•ÍÑÉ¥ÐÑ¼ÍÁ•¥™¥Œ½É¥¥¸¥¸ÁÉ½‘ÕÑ¥½¸)½¹ÍÐ…±±½Ý•‘=É¥¥¹Ì€ô¥ÍAÉ½‘ÕÑ¥½¸(€€ümÁÉ½•ÍÌ¹•¹Ø¹1%9Q}UI0ñð¡ÑÑÁÌè¼¼‘íÁÉ½•ÍÌ¹•¹Ø¹I%1]e}AU	1%}=5%8ñð€Ñ…Õ±¥„µÍ¡½Ý…Í”µÁÉ½‘ÕÑ¥½¸¹ÕÀ¹É…¥±Ý…ä¹…ÁÀõt(€€èm±¥•¹ÑUÉ±tì()…ÁÀ¹ÕÍ”¡½ÉÌ¡ì(€½É¥¥¸è€¡½É¥¥¸°…±±‰…¬¤€ôøì(€€€€¼¼±±½ÜÉ•ÅÕ•ÍÑÌÝ¥Ñ ¹¼½É¥¥¸€¡Í…µ”µ½É¥¥¸°Í•ÉÙ•ÈµÑ¼µÍ•ÉÙ•È¤(€€€¥˜€ …½É¥¥¸¤É•ÑÕÉ¸…±±‰…¬¡¹Õ±°°ÑÉÕ”¤ì(€€€¥˜€¡…±±½Ý•‘=É¥¥¹Ì¹¥¹±Õ‘•Ì¡½É¥¥¸¤¤É•ÑÕÉ¸…±±‰…¬¡¹Õ±°°ÑÉÕ”¤ì(€€€…±±‰…¬¡¹•ÜÉÉ½È 9½Ð…±±½Ý•‰ä=ILœ¤¤ì(€ô°(€É•‘•¹Ñ¥…±ÌèÑÉÕ”°)ô¤¤ì((¼¼I…Ñ”±¥µ¥Ñ¥¹œ)½¹ÍÐ•¹•É…±1¥µ¥Ñ•È€ôÉ…Ñ•1¥µ¥Ð¡ì(€Ý¥¹‘½Ý5Ìè€ÄÔ€¨€ØÀ€¨€ÄÀÀÀ°(€µ…àè¥ÍAÉ½‘ÕÑ¥½¸€ü€ÄÀÀ€è€ÔÀÀ°(€ÍÑ…¹‘…É‘!•…‘•ÉÌèÑÉÕ”°(€±•…å!•…‘•ÉÌè™…±Í”°(€µ•ÍÍ…”èí•ÉÉ½Èè€Q½¼µ…¹äÉ•ÅÕ•ÍÑÌ°Á±•…Í”ÑÉä……¥¸±…Ñ•Èœô°)ô¤ì()½¹ÍÐ…ÕÑ¡1¥µ¥Ñ•È€ôÉ…Ñ•1¥µ¥Ð¡ì(€Ý¥¹‘½Ý5Ìè€ÄÔ€¨€ØÀ€¨€ÄÀÀÀ°(€µ…àè€ÄÀ°(€ÍÑ…¹‘…É‘!•…‘•ÉÌèÑÉÕ”°(€±•…å!•…‘•ÉÌè™…±Í”°(€µ•ÍÍ…”èì•ÉÉ½Èè€Q½¼µ…¹ä…ÕÑ¡•¹Ñ¥…Ñ¥½¸…ÑÑ•µÁÑÌ°Á±•…Í”ÑÉä……¥¸±…Ñ•Èœô°)ô¤ì()…ÁÀ¹ÕÍ”¡µ½É…¸¡¥ÍAÉ½‘ÕÑ¥½¸€ü€½µ‰¥¹•œ€è€‘•Øœ¤¤ì)…ÁÀ¹ÕÍ”¡½½­¥•A…ÉÍ•È ¤¤ì)…ÁÀ¹ÕÍ”¡•áÁÉ•ÍÌ¹©Í½¸¡ì±¥µ¥Ðè€œÄÁµˆœô¤¤ì)…ÁÀ¹ÕÍ”¡•áÁÉ•ÍÌ¹ÕÉ±•¹½‘•¡ì•áÑ•¹‘•èÑÉÕ”°±¥µ¥Ðè€œÄÁµˆœô¤¤ì)…ÁÀ¹ÕÍ”¡•áÁÉ•ÍÌ¹É…Ü¡ìÑåÁ”è€…ÁÁ±¥…Ñ¥½¸½½Ñ•ÐµÍÑÉ•…´œ°±¥µ¥Ðè€œÄÀÁµˆœô¤¤ì((¼¼ÕÑ É…Ñ”±¥µ¥Ñ•È™½È¥¹Ù¥Ñ”•¹‘Á½¥¹ÑÌ)½¹ÍÐ¥¹Ù¥Ñ•1¥µ¥Ñ•È€ôÉ…Ñ•1¥µ¥Ð¡ì(€Ý¥¹‘½Ý5Ìè€ÄÔ€¨€ØÀ€¨€ÄÀÀÀ°(€µ…àè€ÈÀ°(€ÍÑ…¹‘…É‘!•…‘•ÉÌèÑÉÕ”°(€±•…å!•…‘•ÉÌè™…±Í”°(€µ•ÍÍ…”èí•ÉÉ½Èè€Q½¼µ…¹äÉ•ÅÕ•ÍÑÌ°Á±•…Í”ÑÉä……¥¸±…Ñ•Èœô°)ô¤ì((¼¼I…Ñ”±¥µ¥Ñ•È™½ÈÁÉ½ÍÁ•Ð½ÁÕ‰±¥Œ•¹‘Á½¥¹ÑÌ)½¹ÍÐÁÕ‰±¥1¥µ¥Ñ•È€ôÉ…Ñ•1¥µ¥Ð¡ì(€Ý¥¹‘½Ý5Ìè€ÄÔ€¨€ØÀ€¨€ÄÀÀÀ°(€µ…àè€ÌÀ°(€ÍÑ…¹‘…É‘!•…‘•ÉÌèÑÉÕ”°(€±•…å!•…‘•ÉÌè™…±Í”°(€µ•ÍÍ…”èì•ÉÉ½Èè€Q½¼µ…¹äÉ•ÅÕ•ÍÑÌ°Á±•…Í”ÑÉä……¥¸±…Ñ•Èœô°)ô¤ì((¼¼ÁÁ±äÉ…Ñ”±¥µ¥Ñ•ÉÌ)…ÁÀ¹ÕÍ” œ½…Á¤½…ÕÑ ½±½¥¸œ°…ÕÑ¡1¥µ¥Ñ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½…ÕÑ ½…•ÁÐµ¥¹Ù¥Ñ”œ°¥¹Ù¥Ñ•1¥µ¥Ñ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½…ÕÑ ½Ù…±¥‘…Ñ”µ¥¹Ù¥Ñ”œ°¥¹Ù¥Ñ•1¥µ¥Ñ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½ÁÉ½ÍÁ•Ðœ°ÁÕ‰±¥1¥µ¥Ñ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½Ù¥•Ý•Èœ°ÁÕ‰±¥1¥µ¥Ñ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤œ°•¹•É…±1¥µ¥Ñ•È¤ì((¼¼A$É½ÕÑ•Ì)…ÁÀ¹ÕÍ” œ½…Á¤½…ÕÑ œ°…ÕÑ¡I½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½…‘µ¥¸œ°…‘µ¥¹I½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½ÁÉ½Ñ½ÑåÁ•Ìœ°ÁÉ½Ñ½ÑåÁ•ÍI½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½±¥¹­Ìœ°µ…¥1¥¹­ÍI½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½Ù¥•Ý•Èœ°Ù¥•Ý•ÉI½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½ÁÉ½ÍÁ•Ðœ°ÁÉ½ÍÁ•ÑI½ÕÑ•È¤ì)…ÁÀ¹ÕÍ” œ½…Á¤½Ù¥•Ý•Èµ‘…Í¡‰½…Éœ°Ù¥•Ý•É…Í¡I½ÕÑ•È¤ì((¼¼9¼±½¹•ÈÍ•ÉÙ¥¹œÕÁ±½…‘Ì‘¥É•Ñ±ä€´™¥±•ÌÍ•ÉÙ•½¹±äÑ¡É½Õ …ÕÑ¡•¹Ñ¥…Ñ•Ù¥•Ý•ÈÉ½ÕÑ”((¼¼M•ÉÙ”ÍÑ…Ñ¥Œ±¥•¹Ð™¥±•Ì¥¸ÁÉ½‘ÕÑ¥½¸)¥˜€¡¥ÍAÉ½‘ÕÑ¥½¸¤ì(€…ÁÀ¹ÕÍ”¡•áÁÉ•ÍÌ¹ÍÑ…Ñ¥Œ¡Á…Ñ ¹©½¥¸¡}}‘¥É¹…µ”°€ÁÕ‰±¥Œœ¤¤¤ì(€…ÁÀ¹•Ð œ¨œ°€¡É•Ä°É•Ì¤€ôøì(€€€¥˜€ …É•Ä¹Á…Ñ ¹ÍÑ…ÉÑÍ]¥Ñ  œ½…Á¤œ¤€˜˜€…É•Ä¹Á…Ñ ¹ÍÑ…ÉÑÍ]¥Ñ  œ½ÕÁ±½…‘Ìœ¤¤ì(€€€€€É•Ì¹Í•¹‘¥±”¡Á…Ñ ¹©½¥¸¡}}‘¥É¹…µ”°€ÁÕ‰±¥Œœ°€¥¹‘•à¹¡Ñµ°œ¤¤ì(€€€ô(€ô¤ì)ô((¼¼ÉÉ½È¡…¹‘±•È)…ÁÀ¹ÕÍ”¡•ÉÉ½É!…¹‘±•È¤ì()½¹ÍÐA=IP€ôÁÉ½•ÍÌ¹•¹Ø¹A=IPñð€ÌÀÀÄì)½¹ÍÐ!=MP€ôÁÉ½•ÍÌ¹•¹Ø¹!=MPñð€œÀ¸À¸À¸Àœì((¼¼IÕ¸‘…Ñ…‰…Í”µ¥É…Ñ¥½¹Ì…¹Í••‘Ì‰•™½É”ÍÑ…ÉÑ¥¹œÍ•ÉÙ•È)…Íå¹Œ™Õ¹Ñ¥½¸ÍÑ…ÉÑM•ÉÙ•È ¤ì(€ÑÉäì(€€€½¹Í½±”¹±½œ IÕ¹¹¥¹œ‘…Ñ…‰…Í”µ¥É…Ñ¥½¹Ì¸¸¸œ¤ì(€€€…Ý…¥Ð‘ˆ¹µ¥É…Ñ”¹±…Ñ•ÍÐ ¤ì(€€€½¹Í½±”¹±½œ 5¥É…Ñ¥½¹Ì½µÁ±•Ñ”¸œ¤ì((€€€½¹Í½±”¹±½œ IÕ¹¹¥¹œ‘…Ñ…‰…Í”Í••‘Ì¸¸¸œ¤ì(€€€…Ý…¥Ð‘ˆ¹Í••¹ÉÕ¸ ¤ì(€€€½¹Í½±”¹±½œ M••‘Ì½µÁ±•Ñ”¸œ¤ì((€€€…ÁÀ¹±¥ÍÑ•¸¡A=IP°!=MP°€ ¤€ôøì(€€€€€½¹Í½±”¹±½œ¡Q…Õ±¥„M¡½Ý…Í”M•ÉÙ•ÈÉÕ¹¹¥¹œ½¸€‘í!=MQôè‘íA=IQõ€¤ì(€€€ô¤ì(€ô…Ñ €¡•ÉÈ¤ì(€€€½¹Í½±”¹•ÉÉ½È …¥±•Ñ¼¥¹¥Ñ¥…±¥é”‘…Ñ…‰…Í”èœ°•ÉÈ¤ì(€€€ÁÉ½•ÍÌ¹•á¥Ð Ä¤ì(€ô)ô()ÍÑ…ÉÑM•ÉÙ•È ¤ì()µ½‘Õ±”¹•áÁ½ÉÑÌ€ôì…ÁÀ°‘ˆôì(