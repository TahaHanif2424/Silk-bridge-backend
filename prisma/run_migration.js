const prisma = require('../lib/prisma');
require('dotenv').config();

async function main() {
  console.log("Running custom migration to drop duplicate columns via WebSocket...");

  const sqlStatements = [
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "itinerary";',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "durationExcel";',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "groupRetailPrice";',
    'ALTER TABLE "Package" DROP COLUMN IF EXISTS "duration";',
    'ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "duration" TEXT;'
  ];

  for (const sql of sqlStatements) {
    try {
      console.log(`Executing: ${sql}`);
      await prisma.$executeRawUnsafe(sql);
      console.log("Success.");
    } catch (err) {
      console.error(`Error executing statement:`, err.message);
    }
  }

  console.log("Custom schema cleanup migration completed successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
