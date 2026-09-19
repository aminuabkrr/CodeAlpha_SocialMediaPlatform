const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// The DB-level backstop against duplicate follows and race conditions.
// Even if two requests hit the server at the exact same millisecond,
// only one insert can succeed.
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Helpful for "who follows me" / "who do I follow" list queries later.
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

module.exports = mongoose.model('Follow', followSchema);
