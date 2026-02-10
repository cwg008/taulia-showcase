const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);

  // Only log stack traces in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', error.stack);
  }

  // Never leak error details in production
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
