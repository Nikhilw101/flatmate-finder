const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const wipeDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file.");
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Starting deletion process...');

    const db = mongoose.connection.db;

    const collectionsToWipe = [
      'listings',
      'interests',
      'chats',
      'messages',
      'notifications',
      'compatibilities',
      'refreshtokens',
      'tenantprofiles'
    ];

    for (const collectionName of collectionsToWipe) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
      } catch (err) {
        console.log(`Skipping ${collectionName}, might not exist.`);
      }
    }

    // Specially handle Users to keep the admin
    const usersCollection = db.collection('users');
    const userResult = await usersCollection.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${userResult.deletedCount} non-admin users from users collection`);

    const adminCount = await usersCollection.countDocuments({ role: 'admin' });
    console.log(`Remaining admin users: ${adminCount}`);

    console.log('Database wipe completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during wipe process:', error);
    process.exit(1);
  }
};

wipeDatabase();
