/**
 * Seed test user and admin accounts.
 * Run from backend folder: node scripts/seed-test-accounts.js
 * (Ensure .env has MONGO_URI or MONGODB_URI set, or uses default local MongoDB.)
 *
 * Test credentials after running:
 *   User:  user@test.com  /  UserPass123!
 *   Admin: admin@test.com /  AdminPass123!
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/webproj';

const TEST_ACCOUNTS = [
  {
    email: 'user@test.com',
    username: 'testuser',
    password: 'UserPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true,
  },
  {
    email: 'admin@test.com',
    username: 'testadmin',
    password: 'AdminPass123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    isEmailVerified: true,
    adminPermissions: {
      manageBookings: true,
      manageRooms: true,
      manageHousekeeping: true,
      manageUsers: true,
      viewReports: true,
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');

    for (const account of TEST_ACCOUNTS) {
      const { password, ...rest } = account;
      const hashedPassword = await bcrypt.hash(password, 10);
      const doc = {
        ...rest,
        password: hashedPassword,
        authProvider: 'local',
        isBlocked: false,
        emailNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.updateOne(
        { email: account.email },
        { $set: doc },
        { upsert: true }
      );

      const action = result.upsertedCount ? 'Created' : 'Updated';
      console.log(`${action} ${account.role} account: ${account.email}`);
    }

    console.log('\nDone. Test credentials:');
    console.log('  User:  user@test.com  /  UserPass123!');
    console.log('  Admin: admin@test.com /  AdminPass123!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
