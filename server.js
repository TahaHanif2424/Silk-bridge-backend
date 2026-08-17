require('dotenv').config();

// Ensure critical environment variables are present before starting
for (const key of ['JWT_SECRET', 'DATABASE_URL']) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not set. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./lib/prisma');

const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const packageRoutes = require('./routes/packageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const tierRoutes = require('./routes/tierRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Parse allowed CORS origins from environment and defaults
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://caspian-connect-portal.vercel.app',
  'https://silkbridge.pk',
  'https://www.silkbridge.pk'
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Non-browser or same-origin requests (curl, server-to-server, health checks) send no Origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // In non-production environments, permit any localhost/127.0.0.1 port
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/bookings', bookingRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Silkbridge Caspian Connect API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  if (err && /not allowed by CORS/.test(err.message)) {
    return res.status(403).json({ message: err.message, code: 'CORS_REJECTED' });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body', code: 'BAD_JSON' });
  }

  const status = err && (err.status || err.statusCode);
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ message: err.message });
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Server error',
    ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
  });
});

async function initializeDatabase() {
  const sqlStatements = [
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "segment" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "code" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "validity" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "hotelCategory" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "groupNetPrice" DOUBLE PRECISION;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "minPax" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "route" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "shortProgram" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "includes" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "excludes" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "eventIncluded" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "ticketIncluded" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "notes" TEXT;',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "itinerary";',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "durationExcel";',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "groupRetailPrice";',
    'ALTER TABLE "Package" ALTER COLUMN "duration" TYPE TEXT;'
  ];

  for (const sql of sqlStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      if (sql.includes('ALTER COLUMN "duration"')) {
        try {
          await prisma.$executeRawUnsafe('ALTER TABLE "Package" DROP COLUMN IF EXISTS "duration";');
          await prisma.$executeRawUnsafe('ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "duration" TEXT;');
        } catch (e) {
          // ignore
        }
      }
    }
  }

  // Automatic initial seeding if Package table is empty
  try {
    const pkgCount = await prisma.package.count();
    if (pkgCount === 0) {
      const fs = require('fs');
      const path = require('path');
      const seedDataPath = path.join(__dirname, 'prisma', 'seed_data.json');
      if (fs.existsSync(seedDataPath)) {
        const rawData = fs.readFileSync(seedDataPath, 'utf8');
        const packages = JSON.parse(rawData);
        for (const pkg of packages) {
          await prisma.package.create({ data: pkg });
        }
      }
    }
  } catch (e) {
    console.error('Auto-seed check failed:', e.message);
  }
}

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .catch(err => console.error('Database initialization warning:', err.message))
  .finally(() => {
    const server = app.listen(PORT, () => {
      console.log(`Caspian Connect API is running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
        } catch (e) {
          // ignore
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });