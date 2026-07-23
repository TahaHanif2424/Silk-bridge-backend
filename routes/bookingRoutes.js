const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/', protect, bookingController.getBookings);
router.post('/', protect, bookingController.createBooking);

module.exports = router;
