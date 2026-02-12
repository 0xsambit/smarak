import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { UserSchema, UserRole } from '../schemas/user.schema';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritage-db';

// INSTRUCTIONS:
// 1. Go to https://dashboard.clerk.com → Users
// 2. Click on your user
// 3. Copy the User ID (starts with "user_"), Email, and Name
// 4. Replace the values below:

const YOUR_CLERK_USER = {
  clerkId: 'user_39YzFVh0QTpChunoxbU4stP8aO9',  // e.g., "user_2abc..."
  name: 'sambitsingha',               // e.g., "John Doe"
  email: 'thewhitedevil32@gmail.com',             // e.g., "john@example.com"
  role: UserRole.STATE_ADMIN,                 // Default role for new users
};

async function addUser() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const UserModel = connection.model('User', UserSchema);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ clerkId: YOUR_CLERK_USER.clerkId });

    if (existingUser) {
      console.log('ℹ️  User already exists in database:');
      console.log(JSON.stringify(existingUser, null, 2));
      process.exit(0);
    }

    // Create the user
    const user = await UserModel.create({
      clerkId: YOUR_CLERK_USER.clerkId,
      name: YOUR_CLERK_USER.name,
      email: YOUR_CLERK_USER.email,
      role: YOUR_CLERK_USER.role,
      isActive: true,
    });

    console.log('✅ User created successfully!\n');
    console.log('User Details:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);

    console.log('🎉 You can now login to the app!\n');
    console.log('💡 To upgrade to NATIONAL_ADMIN:');
    console.log('   - Open MongoDB Compass');
    console.log('   - Database: heritage-db → Collection: users');
    console.log(`   - Find user with email: ${user.email}`);
    console.log('   - Update role field to "NATIONAL_ADMIN"\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding user:', error);
    process.exit(1);
  }
}

addUser();
