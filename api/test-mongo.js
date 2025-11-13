import connectToDatabase from '../lib/mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('Testing MongoDB connection...');
    const { client, db } = await connectToDatabase();
    
    if (!db) {
      return res.status(500).json({ 
        error: 'MongoDB database is null',
        mongodb_uri_set: !!process.env.MONGODB_URI 
      });
    }

    // Test actual connection
    const testCollection = db.collection('test');
    
    // Try a simple operation
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });

    return res.status(200).json({
      success: true,
      message: 'MongoDB connection successful',
      database: db.databaseName,
      client_connected: client?.topology?.isConnected() || false
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    return res.status(500).json({
      error: 'MongoDB connection failed',
      message: error.message,
      stack: error.stack,
      mongodb_uri_set: !!process.env.MONGODB_URI,
      mongodb_uri_length: process.env.MONGODB_URI?.length || 0
    });
  }
}

