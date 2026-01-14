function errorHandler(err, req, res, next) {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    route: req.method + ' ' + req.path,
    body: req.body
  });
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
module.exports = errorHandler;
