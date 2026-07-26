const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { packageTitle, clientName, status, amount, date } = req.body;
    
    if (!packageTitle || !clientName || !amount || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const booking = await prisma.booking.create({
      data: {
        packageTitle,
        clientName,
        status: status || 'pending',
        amount,
        date
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
