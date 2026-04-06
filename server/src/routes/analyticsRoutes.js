const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticateToken, authorizeRole(['admin']), getAnalytics);

module.exports = router;
