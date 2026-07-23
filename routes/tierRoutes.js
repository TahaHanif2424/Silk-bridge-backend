const express = require('express');
const router = express.Router();
const tierController = require('../controllers/tierController');
const { protect } = require('../middleware/auth');

router.get('/', tierController.getTiers);
router.put('/:id', protect, tierController.updateTier);

module.exports = router;
