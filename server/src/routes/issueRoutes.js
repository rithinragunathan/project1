const express = require('express');
const multer = require('multer');
const { createIssue, getIssues, updateIssueStatus, escalateIssue, getIssueImage } = require('../controllers/issueController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

// Multer setup for in-memory file uploads (since we store in database)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5242880 }, // 5MB
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed'), false);
        } else {
            cb(null, true);
        }
    }
});

router.post('/', authenticateToken, upload.single('image'), createIssue);
router.get('/', authenticateToken, getIssues);
router.get('/:id/image', getIssueImage); // No auth required — browser <img> tags cannot send JWT headers
router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'staff']), updateIssueStatus);
router.post('/:id/escalate', authenticateToken, escalateIssue);

module.exports = router;
