const { validationResult } = require('express-validator');
const { failure } = require('../utils/response');

// Runs after express-validator check(...) chains; short-circuits with 400 on failure
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failure(
      res,
      'Validation failed',
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

module.exports = validate;
