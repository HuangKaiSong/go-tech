import { seedCategories } from './category';
import { seedFeatures } from './feature';

async function seedAll() {
  try {
    await seedCategories();
    await seedFeatures();
    console.log('All seeds completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedAll();
