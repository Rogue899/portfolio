import connectToDatabase from '../../../lib/mongodb.js';
import jwt from 'jsonwebtoken';

// Helper function to extract token from headers (supports both formats)
function extractToken(req) {
  // Try custom 'token' header first
  if (req.headers.token) {
    return req.headers.token;
  }
  
  // Try Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

// Middleware to verify JWT token
function verifyToken(req) {
  const token = extractToken(req);
  
  if (!token) {
    throw new Error('No token provided');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
  const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
  
  const decoded = jwt.verify(token, jwtSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
    algorithms: ['HS256']
  });

  // Verify it's an access token
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

export default async function handler(req, res) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');
    res.setHeader('Content-Type', 'application/json');

    console.log('===== FILE API CALLED =====');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
    const { fileId } = req.query;
    
    // Log for debugging
    console.log('File API called:', { method: req.method, fileId, query: req.query });
    
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }
    
    // Try to get userId from token if available, otherwise use 'guest'
    let userId = 'guest';
    try {
      const decoded = verifyToken(req);
      userId = decoded.id;
    } catch (error) {
      // Not authenticated, use 'guest'
    }

    let db;
    try {
      const { db: database } = await connectToDatabase();
      if (!database) {
        console.error('MongoDB database is null');
        return res.status(500).json({ error: 'MongoDB not configured' });
      }
      db = database;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ 
        error: 'MongoDB connection failed',
        message: error.message
      });
    }
    
    const filesCollection = db.collection('files');
    const fileHistoryCollection = db.collection('fileHistory');

    console.log('Request method:', req.method);
    console.log('Request body:', req.body);

    if (req.method === 'GET') {
      // Get file content - try authenticated user first, then guest
      let file = await filesCollection.findOne({
        fileId: fileId,
        userId: userId
      });
      
      if (!file && userId !== 'guest') {
        // Try guest file
        file = await filesCollection.findOne({
          fileId: fileId,
          userId: 'guest'
        });
      }

      if (file) {
        return res.status(200).json({
          fileId: file.fileId,
          fileName: file.fileName,
          content: file.content,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        });
      } else {
        // File doesn't exist yet, return empty
        return res.status(200).json({
          fileId: fileId,
          content: ''
        });
      }
    }

    if (req.method === 'POST') {
      const { fileName, content } = req.body;

      if (!fileName) {
        return res.status(400).json({ error: 'fileName is required' });
      }

      // Get existing file to save history
      const existingFile = await filesCollection.findOne({
        fileId: fileId,
        userId: userId
      });

      // Only save history for authenticated users
      if (userId !== 'guest' && existingFile && existingFile.content !== content) {
        await fileHistoryCollection.insertOne({
          fileId: fileId,
          userId: userId,
          fileName: existingFile.fileName,
          content: existingFile.content,
          savedAt: existingFile.updatedAt || existingFile.createdAt,
          version: existingFile.version || 1
        });
      }

      // Update or create file
      const version = existingFile ? (existingFile.version || 1) + 1 : 1;
      
      await filesCollection.updateOne(
        {
          fileId: fileId,
          userId: userId
        },
        {
          $set: {
            fileName: fileName,
            content: content || '',
            updatedAt: new Date(),
            version: version
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'File saved',
        fileId: fileId,
        fileName: fileName,
        version: version
      });
    }

    if (req.method === 'DELETE') {
      await filesCollection.deleteOne({
        fileId: fileId,
        userId: userId
      });

      // Optionally delete history too
      await fileHistoryCollection.deleteMany({
        fileId: fileId,
        userId: userId
      });

      return res.status(200).json({ success: true, message: 'File deleted' });
    }

    console.log('No method matched, returning 405. Method was:', req.method);
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
    } catch (error) {
      // Don't return 401 for missing tokens - allow guest access
      console.error('File operation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        fileId: req.query?.fileId,
        method: req.method
      });
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  } catch (error) {
    // Catch any errors during handler initialization
    console.error('===== HANDLER INITIALIZATION ERROR =====');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    try {
      return res.status(500).json({
        error: 'Server error',
        message: error.message,
        name: error.name
      });
    } catch (sendError) {
      console.error('Failed to send error response:', sendError);
      return res.status(500).end();
    }
  }
}
