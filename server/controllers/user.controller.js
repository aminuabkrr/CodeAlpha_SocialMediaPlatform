const User = require('../models/User');
const { success, failure } = require('../utils/response');

// GET /api/users/:username
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!user) {
      return failure(res, 'User not found', 404);
    }

    // isFollowing is resolved here if a Follow model exists later (Stage 4).
    // For now, just return the base profile.
    return success(res, { user }, 'Profile fetched');
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

    // req.user._id comes from the auth token - a user can only ever
    // update the profile attached to their own token, never an :id from params/body.
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
