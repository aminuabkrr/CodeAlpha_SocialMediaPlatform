const Post = require('../models/Post');
const Like = require('../models/Like');
const { success, failure } = require('../utils/response');

const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    const post = await Post.create({ author: req.user._id, content, imageUrl: imageUrl || '' });
    await post.populate('author', 'name username profileImage');
    return success(res, { post }, 'Post created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username profileImage'),
      Post.countDocuments(),
    ]);

    return success(
      res,
      { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Posts fetched'
    );
  } catch (err) {
    next(err);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'name username profileImage'
    );
    if (!post) return failure(res, 'Post not found', 404);
    return success(res, { post }, 'Post fetched');
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return failure(res, 'Post not found', 404);

    if (String(post.author) !== String(req.user._id)) {
      return failure(res, 'You are not authorized to edit this post', 403);
    }

    const { content, imageUrl } = req.body;
    if (content !== undefined) post.content = content;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;

    await post.save();
    await post.populate('author', 'name username profileImage');
    return success(res, { post }, 'Post updated successfully');
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return failure(res, 'Post not found', 404);

    if (String(post.author) !== String(req.user._id)) {
      return failure(res, 'You are not authorized to delete this post', 403);
    }

    await Like.deleteMany({ post: post._id });
    await post.deleteOne();
    return success(res, {}, 'Post deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createPost, getPosts, getPostById, updatePost, deletePost };
