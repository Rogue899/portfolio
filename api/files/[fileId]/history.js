import connectToDatabase from '../../../../lib/mongodb';
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

function verifyToken(req) {
  const token = extractToken(req);
  
  if (!token) {
    throw new Error('No token provided');
  }

  const jwtSecret = process.env.JWT_SECRET;
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req);
    const userId = decoded.id; // Using 'id' to match your token payload
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
    
    const fileHistoryCollection = db.collection('fileHistory');

    const history = await fileHistoryCollection
      .find({
        fileId: fileId,
        userId: userId
      })
      .sort({ savedAt: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json({
      success: true,
      history: history.map(item => ({
        version: item.version,
        content: item.content,
        savedAt: item.savedAt,
        fileName: item.fileName
      }))
    });
  } catch (error) {
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

