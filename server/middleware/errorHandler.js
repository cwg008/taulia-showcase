function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
  }

  // Multer file type error
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  // Don't leak SQL errors
  if (err.code?.startsWith('SQLITE') || err.code?.startsWith('23')) {
    return res.status(500).json({ error: 'Database error occurred' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}

module.exports = errorHandler;
