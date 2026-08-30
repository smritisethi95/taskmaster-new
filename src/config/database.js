import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer = null;

export async function connectDB() {
  try {
    let uri = process.env.MONGODB_URI;

    // If no MONGODB_URI is provided, launch an embedded Mongo Memory Server for zero-setup local runs/tests
    if (!uri) {
      console.log('ℹ️  No MONGODB_URI found in .env. Starting in-memory MongoDB instance for local testing...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

export default connectDB;
