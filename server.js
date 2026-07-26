require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const packageRoutes = require('./routes/packageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const tierRoutes = require('./routes/tierRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser()); 

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Silkbridge B2B Backend is running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});