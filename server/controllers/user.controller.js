const User = require('../models/User');
const Follow = require('../models/Follow');
const { success, failure } = require('../utils/response');

// GET /api/users/:username
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!user) {
      return failure(res, 'User not found', 404);
    }

    let isFollowing = false;

    // req.user is only set if a valid token was attached (optionalAuth, see middleware/auth.js).
    if (req.user && String(req.user._id) !== String(user._id)) {
      const existingFollow = await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      });
      isFollowing = !!existingFollow;
    }

    return success(res, { user, isFollowing }, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'profileImage'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return failure(res, 'No valid fields provided to update', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return success(res, { user: updatedUser }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserProfile, updateProfile };
