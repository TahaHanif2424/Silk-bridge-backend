require('dotenv').config();

// Validated before the route modules load, so a missing value is reported as
// itself rather than as whatever the first dependent module happens to throw.
// Without a secret, jwt.sign throws on login and jwt.verify rejects every
// request, which looks like "auth is broken" instead of "config is missing".
for (const key of ['JWT_SECRET', 'DATABASE_URL']) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not set. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

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

// `origin: true` reflects whatever Origin is sent, which combined with
// credentials: true lets any website issue authenticated requests on a user's
// behalf. Allow localhost in dev (the Vite port is not fixed) and require an
// explicit allowlist everywhere else.
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://caspian-connect-portal.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Same-origin/non-browser callers (curl, health checks) send no Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
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

app.use((err, req, res, next) => {
  if (err && /not allowed by CORS/.test(err.message)) {
    return res.status(403).json({ message: err.message, code: 'CORS_REJECTED' });
  }

  // Malformed JSON bodies and similar already carry a meaningful status;
  // reporting them as 500 hides the fact that the request itself was bad.
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body', code: 'BAD_JSON' });
  }

  const status = err && (err.status || err.statusCode);
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ message: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});