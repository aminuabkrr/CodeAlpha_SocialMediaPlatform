const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { success, failure } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return failure(res, `An account with that ${field} already exists`, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, username, email, passwordHash });

    const token = generateToken(user._id);
    return success(res, { user, token }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!user) {
      return failure(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return failure(res, 'Invalid credentials', 401);
    }

    const token = generateToken(user._id);
    // re-fetch without passwordHash for the response (toJSON strips it too, but this is explicit/safe)
    const safeUser = await User.findById(user._id);
    return success(res, { user: safeUser, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    // req.user set by protect middleware
    return success(res, { user: req.user }, 'Current user fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
