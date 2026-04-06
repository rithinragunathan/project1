const express = require('express');
const { register, login, getUsers, createUser } = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, authorizeRole(['admin']), getUsers);
router.post('/create-user', authenticateToken, authorizeRole(['admin']), createUser);

module.exports = router;
