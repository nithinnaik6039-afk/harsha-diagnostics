import mongoose from 'mongoose';
import { autoSeedIfEmpty } from './autoSeed.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/harsha-diagnostics';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed initial catalog if fresh cluster
    await autoSeedIfEmpty();
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed, proceeding with mock mode. Error:', err.message);
    // Continue without aborting; routes that require DB will handle missing connection.
  }
};

export default connectDB;
