const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const seedDataPath = path.join(__dirname, 'seed_data.json');

async function main() {
  console.log("Reading new seed JSON data...");
  if (!fs.existsSync(seedDataPath)) {
    throw new Error(`Seed data file not found at ${seedDataPath}`);
  }
  
  const rawData = fs.readFileSync(seedDataPath, 'utf8');
  const packages = JSON.parse(rawData);
  console.log(`Loaded ${packages.length} packages from JSON.`);

  console.log("Clearing all existing packages from the database...");
  const deleteResult = await prisma.package.deleteMany({});
  console.log(`Cleared ${deleteResult.count} packages from Package table.`);

  console.log("Seeding packages to aligned schema...");
  let count = 0;
  for (const pkg of packages) {
    try {
      await prisma.package.create({
        data: pkg
      });
      count++;
    } catch (err) {
      console.error(`Failed to seed package ${pkg.id}:`, err.message);
    }
  }
  
  console.log(`Successfully seeded ${count} out of ${packages.length} packages.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Migration/Seeding failed:", e);
    prisma.$disconnect();
  });
