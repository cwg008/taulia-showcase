const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
