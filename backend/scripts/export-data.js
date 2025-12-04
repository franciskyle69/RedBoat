const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

// Export collection directly using mongoose connection
const exportCollection = async (collectionName, filename) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    const data = await collection.find({}).toArray();
    
    const outputPath = path.join(__dirname, 'exported-data', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Exported ${data.length} documents from "${collectionName}" to ${filename}`);
    return data;
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error);
    throw error;
  }
};

// Main export function
const main = async () => {
  try {
    // Use local MongoDB by default
    const uri = process.argv[2] || 'mongodb://localhost:27017/webproj';
    console.log(`📦 Connecting to: ${uri.includes('@') ? uri.replace(/:([^:@]+)@/, ':****@') : uri}`);
    
    await connectDB(uri);

    console.log('📤 Exporting data...\n');

    // Export all collections (using actual MongoDB collection names)
    await exportCollection('users', 'users.json');
    await exportCollection('rooms', 'rooms.json');
    await exportCollection('bookings', 'bookings.json');
    await exportCollection('roomreviews', 'roomreviews.json');
    await exportCollection('notifications', 'notifications.json');
    await exportCollection('feedbacks', 'feedbacks.json');
    await exportCollection('deletedusers', 'deletedusers.json');

    console.log('\n🎉 All data exported to backend/scripts/exported-data/');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { exportCollection, main };
