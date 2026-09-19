const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const { success } = require('../utils/response');

// GET /api/posts/feed?page=&limit=
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = follows.map((f) => f.following);
    const authorIds = [...followingIds, userId];

    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username profileImage'),
      Post.countDocuments({ author: { $in: authorIds } }),
    ]);

    // Resolve which of these posts the current user has liked, in one query
    // rather than N queries per post.
    const postIds = posts.map((p) => p._id);
    const likedDocs = await Like.find({ user: userId, post: { $in: postIds } })
      .select('post')
      .lean();
    const likedPostIds = new Set(likedDocs.map((l) => String(l.post)));

    const postsWithLikeState = posts.map((post) => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(String(post._id)),
    }));

    return success(
      res,
      {
        posts: postsWithLikeState,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Feed fetched'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeed };
