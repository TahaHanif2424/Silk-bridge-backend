const express = require('express');
const router = express.Router();
const { createApplication, getApplications, updateApplication } = require('../controllers/applicationController');
const { protect, optionalProtect, adminOnly } = require('../middleware/auth');

// Public route to submit an application. Uses optionalProtect so the signup flow
// still works before a token exists, while linking the application to the user
// when one is signed in (createApplication treats req.user as optional).
router.post('/', optionalProtect, createApplication);

// Admin-only route to view applications
router.get('/', protect, adminOnly, getApplications);

// Admin-only route to update application (approve/deny/tier)
router.patch('/:id', protect, adminOnly, updateApplication);

module.exports = router;
