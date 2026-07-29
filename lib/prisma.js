const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Neon's WebSocket/HTTP endpoints run on 443, while the raw Postgres wire
// protocol needs outbound 5432 — which many corporate/campus networks drop.
// Routing Prisma through the Neon driver keeps the app usable on those networks.
const useNeonDriver =
  process.env.DB_DRIVER === 'neon' ||
  (process.env.DB_DRIVER !== 'tcp' && /\.neon\.tech(?::\d+)?\//.test(connectionString));

let prisma;

if (useNeonDriver) {
  const { neonConfig } = require('@neondatabase/serverless');
  const { PrismaNeon } = require('@prisma/adapter-neon');
  neonConfig.webSocketConstructor = require('ws');

  prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
