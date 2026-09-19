const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/post.controller');
const { likePost, unlikePost, getPostLikes } = require('../controllers/like.controller');
const { getComments, addComment } = require('../controllers/comment.controller');
const { getFeed } = require('../controllers/feed.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const postValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 500 })
    .withMessage('Post content cannot exceed 500 characters'),
  body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be a valid URL'),
];

// IMPORTANT: /feed must be registered BEFORE /:id, otherwise Express
// would treat "feed" as a post ID and 404/CastError on lookup.
router.get('/feed', protect, getFeed);

router.get('/', getPosts);
router.post('/', protect, postValidation, validate, createPost);
router.get('/:id', getPostById);
router.put(
  '/:id',
  protect,
  [
    body('content')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Content cannot be empty')
      .isLength({ max: 500 })
      .withMessage('Post content cannot exceed 500 characters'),
    body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be a valid URL'),
  ],
  validate,
  updatePost
);
router.delete('/:id', protect, deletePost);

router.post('/:postId/like', protect, likePost);
router.delete('/:postId/like', protect, unlikePost);
router.get('/:postId/likes', getPostLikes);

router.get('/:postId/comments', getComments);
router.post(
  '/:postId/comments',
  protect,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 300 })
      .withMessage('Comment cannot exceed 300 characters'),
  ],
  validate,
  addComment
);

module.exports = router;
