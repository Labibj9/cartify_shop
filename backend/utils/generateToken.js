const jwt = require('jsonwebtoken');

const generateToken = (id, role = 'user', isApproved = false) => {
  return jwt.sign({ id, role, isApproved }, process.env.JWT_SECRET || 'your-jwt-secret', {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
