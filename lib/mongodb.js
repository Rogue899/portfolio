import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('Warning: MONGODB_URI not found in environment variables. MongoDB features will not work.');
}

const options = {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 5000,
  maxPoolSize: 1,
  minPoolSize: 0,
};

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (!uri) {
    console.error('MONGODB_URI is not defined');
    return { client: null, db: null };
  }

  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri, options);
    await client.connect();
    console.log('MongoDB connected successfully');
    
    const db = client.db();
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectToDatabase;

