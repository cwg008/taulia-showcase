const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PROTO_DIR = path.join(UPLOAD_DIR, 'prototypes');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');

// Ensure directories exist
[UPLOAD_DIR, PROTO_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'text/html',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ];
  const allowedExts = ['.html', '.htm', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only HTML and ZIP files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Process an uploaded file for a prototype
async function processUpload(file, prototypeId) {
  const protoDir = path.join(PROTO_DIR, String(prototypeId));

  // Clean existing directory
  if (fs.existsSync(protoDir)) {
    fs.rmSync(protoDir, { recursive: true });
  }
  fs.mkdirSync(protoDir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  let type = 'html';
  let filePath;

  if (ext === '.zip') {
    type = 'zip';
    // Extract zip to prototype directory
    await extractZip(file.path, protoDir);
    // Find the main HTML file
    filePath = findMainHtml(protoDir);
    if (!filePath) {
      throw new Error('No HTML file found in the zip archive');
    }
    filePath = path.relative(UPLOAD_DIR, filePath);
  } else {
    // Single HTML file
    const destPath = path.join(protoDir, 'index.html');
    fs.copyFileSync(file.path, destPath);
    filePath = path.relative(UPLOAD_DIR, destPath);
  }

  // Clean up temp file
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  return {
    type,
    file_path: filePath,
  };
}

// Extract a zip file
async function extractZip(zipPath, destination) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: destination }))
      .on('close', resolve)
      .on('error', reject);
  });
}

// Find the main HTML file in an extracted directory
function findMainHtml(dir) {
  // First check for index.html at root
  const indexPath = path.join(dir, 'index.html');
  if (fs.existsSync(indexPath)) return indexPath;

  // Check for index.htm
  const indexHtm = path.join(dir, 'index.htm');
  if (fs.existsSync(indexHtm)) return indexHtm;

  // Search one level of subdirectories (common with zip containing a folder)
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subIndex = path.join(dir, entry.name, 'index.html');
      if (fs.existsSync(subIndex)) return subIndex;
    }
  }

  // Last resort: find first .html file
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      return path.join(dir, entry.name);
    }
  }

  return null;
}

// Delete prototype files
function deletePrototypeFiles(prototypeId) {
  const protoDir = path.join(PROTO_DIR, String(prototypeId));
  if (fs.existsSync(protoDir)) {
    fs.rmSync(protoDir, { recursive: true });
  }
}

module.exports = { upload, processUpload, deletePrototypeFiles, UPLOAD_DIR, PROTO_DIR };
