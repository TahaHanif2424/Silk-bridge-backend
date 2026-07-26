const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, bookingController.getBookings);
router.post('/', protect, bookingController.createBooking);
router.patch('/:id', protect, adminOnly, bookingController.updateBooking);

module.exports = router;
