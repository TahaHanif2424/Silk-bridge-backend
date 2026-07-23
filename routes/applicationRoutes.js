const express = require('express');
const router = express.Router();
const { createApplication, getApplications } = require('../controllers/applicationController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route to submit an application
router.post('/', protect, createApplication);

// Admin-only route to view applications
router.get('/', protect, adminOnly, getApplications);

module.exports = router;
