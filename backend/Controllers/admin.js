exports.getDashboard = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    // Add dashboard logic here
    res.json({ success: true, message: 'Admin dashboard data' });
  } catch (err) {
    next(err);
  }
};
