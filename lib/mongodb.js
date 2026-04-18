import mongoose from 'mongoose';

// Use IPv4 first to resolve MongoDB SRV records (fixes AdGuard/custom DNS issues)
// Note: We only set defaultResultOrder instead of setServers to avoid
// overriding global DNS for all connections in the app.
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      family: 4,
    }).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
