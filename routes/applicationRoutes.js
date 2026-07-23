const express = require('express');
const router = express.Router();
const { createApplication, getApplications, updateApplication } = require('../controllers/applicationController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route to submit an application
router.post('/', protect, createApplication);

// Admin-only route to view applications
router.get('/', protect, adminOnly, getApplications);

// Admin-only route to update application (approve/deny/tier)
router.patch('/:id', protect, adminOnly, updateApplication);

module.exports = router;
