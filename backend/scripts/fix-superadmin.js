// Fix superadmin permissions
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function fixSuperadmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { email: 'franciskyle6969@gmail.com' },
      {
        $set: {
          role: 'superadmin',
          adminPermissions: {
            manageBookings: true,
            manageRooms: true,
            manageHousekeeping: true,
            manageUsers: true,
            viewReports: true
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('User not found!');
    } else {
      console.log('✅ Superadmin permissions fixed!');
      console.log('Updated:', result.modifiedCount, 'document(s)');
    }

    // Verify the update
    const user = await usersCollection.findOne({ email: 'franciskyle6969@gmail.com' });
    console.log('User now:', {
      email: user.email,
      role: user.role,
      adminPermissions: user.adminPermissions
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixSuperadmin();
