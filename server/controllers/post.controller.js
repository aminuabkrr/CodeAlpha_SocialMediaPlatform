const Post = require('../models/Post');
const Like = require('../models/Like');
const { success, failure } = require('../utils/response');

// createPost, getPosts, getPostById, updatePost unchanged from Stage 5 — only deletePost shown here

// DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return failure(res, 'Post not found', 404);
    }

    if (String(post.author) !== String(req.user._id)) {
      return failure(res, 'You are not authorized to delete this post', 403);
    }

    await Like.deleteMany({ post: post._id });
    // Comment cleanup added in Stage 7 once the Comment model exists.
    await post.deleteOne();

    return success(res, {}, 'Post deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { deletePost }; // createPost, getPosts, getPostById, updatePost still exported as before
