const fs = require('fs');
const path = require('path');

const handleUpload = async (req, prototypeId, prototypeDirId) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'prototypes', prototypeDirId);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Manual multipart parsing stub - just save raw body as index.html if it's HTML
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/octet-stream')) {
      const filePath = path.join(uploadsDir, 'index.html');
      fs.writeFileSync(filePath, req.body);
      return filePath;
    }

    // For form data, try to extract file from body
    if (req.body && typeof req.body === 'object' && req.body.file) {
      const filePath = path.join(uploadsDir, 'index.html');
      fs.writeFileSync(filePath, req.body.file);
      return filePath;
    }

    console.log('No file data found in request');
    return null;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
};

const extractZip = async (zipPath, targetDir) => {
  // Stub: just copy the file as-is for now
  // In a real implementation, you'd use a library like 'unzipper'
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = path.basename(zipPath);
    const targetPath = path.join(targetDir, fileName);
    fs.copyFileSync(zipPath, targetPath);

    console.log(`Copied ${zipPath} to ${targetPath}`);
    return targetPath;
  } catch (error) {
    console.error('Zip extraction error:', error.message);
    throw error;
  }
};

module.exports = { handleUpload, extractZip };
