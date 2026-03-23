import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { UserSchema, UserRole } from '../schemas/user.schema';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritage-db';

const parseArgs = () => {
  return process.argv.slice(2).reduce<Record<string, string>>((accumulator, entry) => {
    if (!entry.startsWith('--')) {
      return accumulator;
    }

    const [rawKey, ...rawValue] = entry.slice(2).split('=');
    if (!rawKey || rawValue.length === 0) {
      return accumulator;
    }

    accumulator[rawKey] = rawValue.join('=');
    return accumulator;
  }, {});
};

const normalizeRole = (role?: string) => {
  return role && (Object.values(UserRole) as string[]).includes(role)
    ? (role as UserRole)
    : UserRole.NATIONAL_ADMIN;
};

async function addUser() {
  const args = parseArgs();
  const clerkId = args.clerkId || process.env.BOOTSTRAP_ADMIN_CLERK_ID;
  const email = args.email || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const name = args.name || process.env.BOOTSTRAP_ADMIN_NAME || 'Bootstrap Admin';
  const role = normalizeRole(args.role);

  if (!clerkId || !email) {
    console.error('Missing clerkId or email. Provide them via backend/.env or CLI flags.');
    console.error('Example: npm run seed -- --clerkId=user_123 --email=admin@example.com');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...\n');
    await connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const UserModel = connection.model('User', UserSchema);
    const user = await UserModel.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        email: email.toLowerCase(),
        name,
        role,
        isActive: true,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    console.log('User ready.');
    console.log(`Mongo ID: ${user._id}`);
    console.log(`Clerk ID: ${user.clerkId}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create or update user:', error);
    process.exit(1);
  }
}

addUser();
