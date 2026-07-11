const adminOrVendor = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || (req.user.role === 'vendor' && req.user.isApproved))) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin or approved vendor access required' });
  }
};

module.exports = adminOrVendor;
