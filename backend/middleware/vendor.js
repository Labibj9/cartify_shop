const vendor = (req, res, next) => {
  if (req.user && req.user.role === 'vendor' && req.user.isApproved === true) {
    next();
  } else if (req.user && req.user.role === 'vendor') {
    res.status(403).json({ success: false, message: 'Your vendor account is not approved yet. Please wait for admin approval.' });
  } else {
    res.status(403).json({ success: false, message: 'Vendor access required' });
  }
};

module.exports = vendor;
