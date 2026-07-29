const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
require('dotenv').config();

async function main() {
  const jsonPath = path.join(__dirname, 'seed_data.json');
  console.log(`Reading seed data from ${jsonPath}...`);
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at ${jsonPath}`);
  }
  
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const packages = JSON.parse(rawData);
  console.log(`Loaded ${packages.length} packages from JSON.`);

  console.log("Seeding packages to the database...");
  let count = 0;
  for (const pkg of packages) {
    try {
      await prisma.package.upsert({
        where: { id: pkg.id },
        update: pkg,
        create: pkg
      });
      count++;
    } catch (err) {
      console.error(`Error seeding package with ID ${pkg.id}:`, err.message);
    }
  }
  console.log(`Successfully upserted ${count} out of ${packages.length} packages.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
