const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getUserProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// IMPORTANT: /profile must be registered before /:username,
// otherwise Express would treat "profile" as a :username value.
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

router.get('/:username', getUserProfile);

module.exports = router;
