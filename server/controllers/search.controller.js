const User = require('../models/User');
const Follow = require('../models/Follow');
const { success, failure } = require('../utils/response');

// GET /api/users/search?q=&page=&limit=
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return failure(res, 'A search query is required', 400);
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Escape regex special characters so a query like "a.b+" doesn't
    // throw or behave unexpectedly as a regex pattern.
    const safeQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safeQuery, 'i');

    const filter = {
      $or: [{ username: pattern }, { name: pattern }],
    };

    // Exclude the searching user from their own results (if authenticated).
    if (req.user) {
      filter._id = { $ne: req.user._id };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name username profileImage bio')
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    let followingSet = new Set();
    if (req.user && users.length > 0) {
      const followDocs = await Follow.find({
        follower: req.user._id,
        following: { $in: users.map((u) => u._id) },
      })
        .select('following')
        .lean();
      followingSet = new Set(followDocs.map((f) => String(f.following)));
    }

    const results = users.map((user) => ({
      ...user.toObject(),
      isFollowing: followingSet.has(String(user._id)),
    }));

    return success(
      res,
      { users: results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      'Search results fetched'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { searchUsers };
