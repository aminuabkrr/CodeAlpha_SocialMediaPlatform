const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { success, failure } = require('../utils/response');

// GET /api/posts/:postId/comments
const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return failure(res, 'Post not found', 404);
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ post: postId })
        .sort({ createdAt: 1 }) // oldest first, natural conversation order
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username profileImage'),
      Comment.countDocuments({ post: postId }),
    ]);

    return success(
      res,
      { comments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Comments fetched'
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:postId/comments
const addComment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return failure(res, 'Post not found', 404);
    }

    session.startTransaction();

    let comment;
    try {
      const created = await Comment.create(
        [{ post: postId, author: req.user._id, content }],
        { session }
      );
      comment = created[0];

      await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await comment.populate('author', 'name username profileImage');

    return success(res, { comment }, 'Comment added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return failure(res, 'Comment not found', 404);
    }

    // Ownership check: only the comment's own author may delete it -
    // the post's author does NOT get delete rights over others' comments
    // per the spec ("Only the comment author should be able to delete").
    if (String(comment.author) !== String(req.user._id)) {
      return failure(res, 'You are not authorized to delete this comment', 403);
    }

    session.startTransaction();

    try {
      await Comment.findByIdAndDelete(comment._id, { session });
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return success(res, {}, 'Comment deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, deleteComment };
