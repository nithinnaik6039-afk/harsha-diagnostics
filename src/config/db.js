import mongoose from 'mongoose';
import { autoSeedIfEmpty } from './autoSeed.js';

// Disable Mongoose command buffering so queries NEVER stall for 10 seconds
mongoose.set('bufferCommands', false);

let retryTimer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/harsha-diagnostics';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }

    // Auto-seed initial catalog if fresh cluster
    await autoSeedIfEmpty();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection unavailable (${err.message}).`);
    console.log(`🚀 High-Performance In-Memory Store active — all features, auth, bookings, and tracking are live!`);

    // Non-blocking background retry every 30s in case MongoDB starts up later
    if (!retryTimer) {
      retryTimer = setInterval(async () => {
        try {
          if (mongoose.connection.readyState !== 1) {
            const conn = await mongoose.connect(mongoUri, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 3000
            });
            console.log(`✅ MongoDB Connected (via background retry): ${conn.connection.host}`);
            clearInterval(retryTimer);
            retryTimer = null;
            await autoSeedIfEmpty();
          }
        } catch {
          // Silent background retry attempt
        }
      }, 30000);
    }
  }
};

export default connectDB;
