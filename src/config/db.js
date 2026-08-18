import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/harsha-diagnostics');
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed, proceeding with mock mode. Error:', err.message);
      // Continue without aborting; routes that require DB will handle missing connection.
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
