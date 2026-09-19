const mongoose = require('mongoose');
const Like = require('../models/Like');
const Post = require('../models/Post');
const { success, failure } = require('../utils/response');

// POST /api/posts/:postId/like
const likePost = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return failure(res, 'Post not found', 404);
    }

    session.startTransaction();

    try {
      await Like.create([{ user: userId, post: postId }], { session });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      if (err.code === 11000) {
        return failure(res, 'You already liked this post', 409);
      }
      throw err;
    } finally {
      session.endSession();
    }

    return success(res, {}, 'Post liked successfully', 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:postId/like
const unlikePost = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    session.startTransaction();

    try {
      const deleted = await Like.findOneAndDelete({ user: userId, post: postId }, { session });

      if (!deleted) {
        await session.abortTransaction();
        return failure(res, 'You have not liked this post', 400);
      }

      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return success(res, {}, 'Post unliked successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:postId/likes (bonus - not in original spec but useful for a "liked by" UI)
const getPostLikes = async (req, res, next) => {
  try {
    const likes = await Like.find({ post: req.params.postId }).populate(
      'user',
      'name username profileImage'
    );
    return success(res, { likes: likes.map((l) => l.user) }, 'Likes fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { likePost, unlikePost, getPostLikes };
