const mongoose = require('mongoose');

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

// Clear all collections
const clearAllData = async () => {
  try {
    console.log('🗑️  Clearing all collections...');
    
    // Clear each collection
    await User.deleteMany({});
    console.log('✅ Users collection cleared');
    
    await Room.deleteMany({});
    console.log('✅ Rooms collection cleared');
    
    await Booking.deleteMany({});
    console.log('✅ Bookings collection cleared');
    
    await ResetToken.deleteMany({});
    console.log('✅ Reset tokens collection cleared');
    
    console.log('🎉 All collections cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await clearAllData();
  } catch (error) {
    console.error('❌ Clear operation failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { clearAllData };
