const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getUserProfile, updateProfile } = require('../controllers/user.controller');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require('../controllers/follow.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional().isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
    body('profileImage').optional().trim(),
  ],
  validate,
  updateProfile
);

router.post('/:userId/follow', protect, followUser);
router.delete('/:userId/follow', protect, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
