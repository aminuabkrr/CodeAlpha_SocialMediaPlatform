const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { success, failure } = require('../utils/response');

// GET /api/posts/feed?page=&limit=
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Get IDs of everyone this user follows.
    const follows = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = follows.map((f) => f.following);

    // Feed = own posts + posts from followed users.
    const authorIds = [...followingIds, userId];

    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username profileImage'),
      Post.countDocuments({ author: { $in: authorIds } }),
    ]);

    return success(
      res,
      {
        posts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Feed fetched'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeed };
