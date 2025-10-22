const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const ResetToken = require('../models/ResetToken');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webproj');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Import function
const importData = async (collection, data) => {
  try {
    const result = await collection.insertMany(data);
    console.log(`✅ Imported ${result.length} documents to ${collection.modelName}`);
    return result;
  } catch (error) {
    console.error(`❌ Error importing to ${collection.modelName}:`, error);
    throw error;
  }
};

// Clear collection function
const clearCollection = async (collection) => {
  try {
    await collection.deleteMany({});
    console.log(`🗑️  Cleared ${collection.modelName} collection`);
  } catch (error) {
    console.error(`❌ Error clearing ${collection.modelName}:`, error);
    throw error;
  }
};

// Main import function
const main = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await clearCollection(User);
    await clearCollection(Room);
    await clearCollection(Booking);
    await clearCollection(ResetToken);

    // Import users
    console.log('👥 Importing users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data/users.json'), 'utf8'));
    await importData(User, usersData);

    // Import rooms
    console.log('🏨 Importing rooms...');
    const roomsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data/rooms.json'), 'utf8'));
    await importData(Room, roomsData);

    // Import bookings
    console.log('📅 Importing bookings...');
    const bookingsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data/bookings.json'), 'utf8'));
    await importData(Booking, bookingsData);

    // Import reset tokens
    console.log('🔑 Importing reset tokens...');
    const resetTokensData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data/resettokens.json'), 'utf8'));
    await importData(ResetToken, resetTokensData);

    console.log('🎉 All data imported successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { importData, clearCollection, main };
