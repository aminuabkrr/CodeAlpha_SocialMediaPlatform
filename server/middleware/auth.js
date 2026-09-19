const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { failure } = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return failure(res, 'Not authorized, no token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return failure(res, 'Not authorized, invalid or expired token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return failure(res, 'Not authorized, user no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Attaches req.user if a valid token is present; otherwise just continues.
// Used on public routes that behave slightly differently for logged-in viewers.
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch (err) {
      // invalid/expired token on an optional route - just proceed unauthenticated
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, optionalAuth };
