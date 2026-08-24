import mongoose from 'mongoose';

let isConnecting = false;
let connectionFailed = false;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return; // Already connected
  if (isConnecting || connectionFailed) return;     // Skip if already trying or known to fail

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set. Database features unavailable.');
    connectionFailed = true;
    return;
  }

  isConnecting = true;
  try {
    console.log(`Connecting to MongoDB Atlas at: ${uri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000
    });
    console.log('Connected to MongoDB Atlas Cloud Database successfully!');
  } catch (err: any) {
    console.warn(`MongoDB Atlas connection failed (${err.message}). DB features unavailable.`);
    connectionFailed = true;
  } finally {
    isConnecting = false;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
