import connectToDatabase from '../../../lib/mongodb.js';
import jwt from 'jsonwebtoken';

// Helper function to extract token from headers (supports both formats)
function extractToken(req) {
  if (req.headers.token) {
    return req.headers.token;
  }
  
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Verify authentication - only authenticated users can view access logs
      const decoded = verifyToken(req);
      const { fileId } = req.query;

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
        return res.status(500).json({ 
          error: 'MongoDB connection failed',
          message: error.message 
        });
      }
      
      const fileAccessLogsCollection = db.collection('fileAccessLogs');

      // Get all access logs for this file, sorted by most recent first
      const logs = await fileAccessLogsCollection
        .find({
          fileId: fileId
        })
        .sort({ timestamp: -1 })
        .limit(100) // Limit to 100 most recent entries
        .toArray();

      return res.status(200).json({
        success: true,
        logs: logs.map(log => ({
          action: log.action,
          userId: log.userId,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
          userAgent: log.userAgent,
          fileName: log.fileName
        }))
      });
    } catch (error) {
      console.error('Access logs error:', error);
      if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Unauthorized - Authentication required' });
      }
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  } catch (error) {
    // Catch any errors during handler initialization
    console.error('Handler initialization error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}

