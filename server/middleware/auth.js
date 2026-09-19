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

    req.user = user; // full user doc (passwordHash excluded by default select:false)
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
