const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { success, failure } = require('../utils/response');

// POST /api/users/:userId/follow
const followUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (userId === String(followerId)) {
      return failure(res, 'You cannot follow yourself', 400);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return failure(res, 'User not found', 404);
    }

    session.startTransaction();

    try {
      // Unique index also protects against this, but checking first gives
      // a clean 409 message instead of a raw duplicate-key error.
      await Follow.create([{ follower: followerId, following: userId }], { session });

      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }, { session });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } }, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      if (err.code === 11000) {
        return failure(res, 'You already follow this user', 409);
      }
      throw err;
    } finally {
      session.endSession();
    }

    return success(res, {}, 'Followed successfully', 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:userId/follow
const unfollowUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    session.startTransaction();

    try {
      const deleted = await Follow.findOneAndDelete(
        { follower: followerId, following: userId },
        { session }
      );

      if (!deleted) {
        await session.abortTransaction();
        return failure(res, 'You do not follow this user', 400);
      }

      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }, { session });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } }, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return success(res, {}, 'Unfollowed successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/followers
const getFollowers = async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.params.userId }).populate(
      'follower',
      'name username profileImage bio'
    );
    return success(res, { followers: follows.map((f) => f.follower) }, 'Followers fetched');
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/following
const getFollowing = async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.params.userId }).populate(
      'following',
      'name username profileImage bio'
    );
    return success(res, { following: follows.map((f) => f.following) }, 'Following list fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
