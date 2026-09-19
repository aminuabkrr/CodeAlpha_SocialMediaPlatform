const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  { timestamps: true }
);

// DB-level guarantee: one user can only have one like per post,
// even under concurrent duplicate requests.
likeSchema.index({ user: 1, post: 1 }, { unique: true });

// Fast lookup of "all likes for this post" (e.g. for a future "liked by" list).
likeSchema.index({ post: 1 });

module.exports = mongoose.model('Like', likeSchema);
