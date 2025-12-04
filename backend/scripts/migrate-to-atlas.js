const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Import data to collection
const importData = async (collectionName, data) => {
  try {
    if (data.length === 0) {
      console.log(`⏭️  No data to import for "${collectionName}"`);
      return [];
    }
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    const result = await collection.insertMany(data);
    console.log(`✅ Imported ${result.insertedCount} documents to "${collectionName}"`);
    return result;
  } catch (error) {
    console.error(`❌ Error importing to ${collectionName}:`, error);
    throw error;
  }
};

// Clear collection function
const clearCollection = async (collectionName) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    const result = await collection.deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} documents from "${collectionName}"`);
  } catch (error) {
    // Collection might not exist, that's okay
    console.log(`⏭️  Collection "${collectionName}" doesn't exist or is empty`);
  }
};

// Read exported data
const readExportedData = (filename) => {
  const filePath = path.join(__dirname, 'exported-data', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Main migration function
const main = async () => {
  try {
    const atlasUri = process.env.MONGO_URI;
    
    if (!atlasUri || !atlasUri.includes('mongodb')) {
      console.error('❌ Please set MONGO_URI in your .env file with your Atlas connection string');
      console.log('   Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname');
      process.exit(1);
    }

    console.log('🚀 Migrating data to MongoDB Atlas...');
    console.log(`📦 Target: ${atlasUri.replace(/:([^:@]+)@/, ':****@')}\n`);
    
    await connectDB(atlasUri);

    // Check if exported data exists
    const exportedDir = path.join(__dirname, 'exported-data');
    if (!fs.existsSync(exportedDir)) {
      console.error('❌ No exported data found. Run "node scripts/export-data.js" first.');
      process.exit(1);
    }

    // Ask for confirmation
    console.log('⚠️  This will CLEAR existing data in Atlas and import from exported-data/');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clear existing data in Atlas
    console.log('🗑️  Clearing existing Atlas data...');
    await clearCollection('users');
    await clearCollection('rooms');
    await clearCollection('bookings');
    await clearCollection('roomreviews');
    await clearCollection('notifications');
    await clearCollection('feedbacks');
    await clearCollection('deletedusers');

    console.log('\n📥 Importing data to Atlas...');
    
    // Import data
    await importData('users', readExportedData('users.json'));
    await importData('rooms', readExportedData('rooms.json'));
    await importData('bookings', readExportedData('bookings.json'));
    await importData('roomreviews', readExportedData('roomreviews.json'));
    await importData('notifications', readExportedData('notifications.json'));
    await importData('feedbacks', readExportedData('feedbacks.json'));
    await importData('deletedusers', readExportedData('deletedusers.json'));

    console.log('\n🎉 Migration to Atlas completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
