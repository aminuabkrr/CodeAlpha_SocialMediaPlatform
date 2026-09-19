const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

router.get('/', (req, res) => {
  success(res, { uptime: process.uptime() }, 'API is healthy');
});

module.exports = router;
