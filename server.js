// Load environment variables FIRST before any imports that depend on them
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clientPromise from './lib/mongodb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'desktop-data.json');
const FILES_DIR = path.join(__dirname, 'files');

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ iconPositions: {}, desktopItems: [] }));
}

// GET desktop data
app.get('/api/desktop', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading desktop data:', error);
    res.json({ iconPositions: {}, desktopItems: [] });
  }
});

// POST desktop data
app.post('/api/desktop', (req, res) => {
  try {
    const { iconPositions, desktopItems } = req.body;
    const data = {
      iconPositions: iconPositions || {},
      desktopItems: desktopItems || []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Desktop data saved' });
  } catch (error) {
    console.error('Error saving desktop data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File operations
// GET file content
app.get('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(FILES_DIR, `${fileId}.txt`);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.json({
        fileId: fileId,
        content: content
      });
    } else {
      // File doesn't exist yet, return empty
      res.json({
        fileId: fileId,
        content: ''
      });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// POST/Save file content
app.post('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const { fileName, content } = req.body;
    const filePath = path.join(FILES_DIR, `${fileId}.txt`);
    
    fs.writeFileSync(filePath, content || '', 'utf8');
    res.json({ 
      success: true, 
      message: 'File saved',
      fileId: fileId,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// DELETE file (legacy - will be replaced by MongoDB version)
app.delete('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(FILES_DIR, `${fileId}.txt`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ===== MongoDB Routes =====

// Helper function to extract IP address from request
function getClientIP(req) {
  // Check various headers (Vercel, proxies, etc.)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one (original client)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Check other common headers
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }
  
  // Fallback to connection remote address
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  return 'unknown';
}

// Helper function to parse user agent and extract browser/OS info
function parseUserAgent(userAgent) {
  if (!userAgent || userAgent === 'unknown') {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      device: 'Unknown'
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/);
    if (match) browserVersion = match[1];
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) os = 'Windows 10/11';
    else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
    else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
    else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  } else if (ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android ([\d.]+)/);
    if (match) os = `Android ${match[1]}`;
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os ([\d_]+)/);
    if (match) os = `iOS ${match[1].replace(/_/g, '.')}`;
  }
  
  // Detect device type
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }
  
  return {
    browser,
    browserVersion,
    os,
    device
  };
}

// Helper function to extract additional request metadata
function getRequestMetadata(req) {
  const userAgentInfo = parseUserAgent(req.headers['user-agent']);
  
  return {
    referrer: req.headers['referer'] || req.headers['referrer'] || null,
    origin: req.headers['origin'] || null,
    acceptLanguage: req.headers['accept-language'] || null,
    acceptEncoding: req.headers['accept-encoding'] || null,
    ...userAgentInfo,
    requestMethod: req.method,
    contentType: req.headers['content-type'] || null,
    contentLength: req.headers['content-length'] ? parseInt(req.headers['content-length']) : null
  };
}

// Helper function to extract token from headers
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
function verifyToken(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
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
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const client = await clientPromise;
    if (!client) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
    const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '7d';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    const accessTokenPayload = {
      id: user._id.toString(),
      type: 'access',
      email: user.email
    };

    const refreshTokenPayload = {
      id: user._id.toString(),
      type: 'refresh',
      email: user.email
    };

    const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: accessExpiresIn,
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
      expiresIn: refreshExpiresIn,
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithm: 'HS256'
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
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
      return res.status(401).json({ error: 'Invalid token type' });
    }

    return res.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// MongoDB File routes
// GET /api/files/:fileId (public - anyone can read)
app.get('/api/files/:fileId', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      // Fallback to file system if MongoDB not configured
      const filePath = path.join(FILES_DIR, `${req.params.fileId}.txt`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return res.json({
          fileId: req.params.fileId,
          content: content
        });
      } else {
        return res.json({
          fileId: req.params.fileId,
          content: ''
        });
      }
    }

    const { fileId } = req.params;

    const client = await clientPromise;
    if (!client) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const filesCollection = db.collection('files');
    const fileAccessLogsCollection = db.collection('fileAccessLogs');

    // Get client IP address
    const clientIP = getClientIP(req);
    
    // Try to get userId from token if available, otherwise use 'guest'
    let userId = 'guest';
    try {
      const token = extractToken(req);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET;
        const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
        const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
        const decoded = jwt.verify(token, jwtSecret, {
          issuer: jwtIssuer,
          audience: jwtAudience,
          algorithms: ['HS256']
        });
        if (decoded.type === 'access') {
          userId = decoded.id;
        }
      }
    } catch (error) {
      // Not authenticated, use 'guest'
    }

    let file = await filesCollection.findOne({
      fileId: fileId
    });

    // Get additional metadata
    const metadata = getRequestMetadata(req);

    // Log file view access
    await fileAccessLogsCollection.insertOne({
      fileId: fileId,
      action: 'view',
      userId: userId,
      ipAddress: clientIP,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ...metadata,
      fileSize: file ? (file.content || '').length : 0
    });

    if (file) {
      return res.json({
        fileId: file.fileId,
        fileName: file.fileName,
        content: file.content,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      });
    } else {
      return res.json({
        fileId: fileId,
        content: ''
      });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return res.status(500).json({ error: 'Failed to read file' });
  }
});

// POST /api/files/:fileId (public - anyone can save, but password protected files need password)
app.post('/api/files/:fileId', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      // Fallback to file system if MongoDB not configured
      const { fileId } = req.params;
      const { fileName, content } = req.body;
      const filePath = path.join(FILES_DIR, `${fileId}.txt`);
      fs.writeFileSync(filePath, content || '', 'utf8');
      return res.json({ 
        success: true, 
        message: 'File saved',
        fileId: fileId,
        fileName: fileName
      });
    }

    const { fileId } = req.params;
    const { fileName, content } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // Try to get userId from token if available, otherwise use 'guest' (for history only)
    let userId = 'guest';
    try {
      const token = extractToken(req);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET;
        const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
        const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
        const decoded = jwt.verify(token, jwtSecret, {
          issuer: jwtIssuer,
          audience: jwtAudience,
          algorithms: ['HS256']
        });
        if (decoded.type === 'access') {
          userId = decoded.id;
        }
      }
    } catch (error) {
      // Not authenticated, use 'guest'
    }

    const client = await clientPromise;
    if (!client) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const filesCollection = db.collection('files');
    const fileHistoryCollection = db.collection('fileHistory');
    const fileAccessLogsCollection = db.collection('fileAccessLogs');

    // Get client IP address
    const clientIP = getClientIP(req);

    // Get existing file to save history (files are public, find by fileId only)
    const existingFile = await filesCollection.findOne({
      fileId: fileId
    });

    // Only save history for authenticated users (userId used ONLY for history)
    if (userId !== 'guest' && existingFile && existingFile.content !== content) {
      await fileHistoryCollection.insertOne({
        fileId: fileId,
        userId: userId,
        fileName: existingFile.fileName,
        content: existingFile.content,
        savedAt: existingFile.updatedAt || existingFile.createdAt,
        version: existingFile.version || 1,
        ipAddress: clientIP
      });
    }

    // Update or create file (files are completely public - no userId stored or filtered)
    const version = existingFile ? (existingFile.version || 1) + 1 : 1;
    const isNewFile = !existingFile;
    
    await filesCollection.updateOne(
      {
        fileId: fileId
      },
      {
        $set: {
          fileName: fileName,
          content: content || '',
          updatedAt: new Date(),
          version: version
        },
        $unset: {
          userId: "" // Remove userId field if it exists (for existing files)
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Log file creation or edit
    await fileAccessLogsCollection.insertOne({
      fileId: fileId,
      action: isNewFile ? 'create' : 'edit',
      userId: userId,
      ipAddress: clientIP,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      fileName: fileName
    });

    return res.json({
      success: true,
      message: 'File saved',
      fileId: fileId,
      fileName: fileName,
      version: version
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return res.status(500).json({ error: 'Failed to save file' });
  }
});

// DELETE /api/files/:fileId (public - anyone can delete)
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      // Fallback to file system
      const { fileId } = req.params;
      const filePath = path.join(FILES_DIR, `${fileId}.txt`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: 'File deleted' });
      } else {
        return res.status(404).json({ error: 'File not found' });
      }
    }

    const { fileId } = req.params;
    // Try to get userId from token if available, otherwise use 'guest'
    let userId = 'guest';
    try {
      const token = extractToken(req);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET;
        const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
        const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
        const decoded = jwt.verify(token, jwtSecret, {
          issuer: jwtIssuer,
          audience: jwtAudience,
          algorithms: ['HS256']
        });
        if (decoded.type === 'access') {
          userId = decoded.id;
        }
      }
    } catch (error) {
      // Not authenticated, use 'guest'
    }

    const client = await clientPromise;
    if (!client) {
      // Should not reach here if MongoDB check passed, but just in case
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const filesCollection = db.collection('files');
    const fileHistoryCollection = db.collection('fileHistory');
    const fileAccessLogsCollection = db.collection('fileAccessLogs');

    // Get client IP address
    const clientIP = getClientIP(req);

    // Log file deletion before deleting
    await fileAccessLogsCollection.insertOne({
      fileId: fileId,
      action: 'delete',
      userId: userId,
      ipAddress: clientIP,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    await filesCollection.deleteOne({
      fileId: fileId
    });

    await fileHistoryCollection.deleteMany({
      fileId: fileId
    });

    return res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// GET /api/files/:fileId/history
app.get('/api/files/:fileId/history', verifyToken, async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }

    const { fileId } = req.params;
    const userId = req.user.id;

    const client = await clientPromise;
    if (!client) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const fileHistoryCollection = db.collection('fileHistory');

    const history = await fileHistoryCollection
      .find({
        fileId: fileId,
        userId: userId
      })
      .sort({ savedAt: -1 })
      .limit(50)
      .toArray();

    return res.json({
      success: true,
      history: history.map(item => ({
        version: item.version,
        content: item.content,
        savedAt: item.savedAt,
        fileName: item.fileName
      }))
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/files/:fileId/access-logs (authenticated only)
app.get('/api/files/:fileId/access-logs', verifyToken, async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }

    const { fileId } = req.params;

    const client = await clientPromise;
    if (!client) {
      return res.status(500).json({ error: 'MongoDB not configured' });
    }
    const db = client.db();
    const fileAccessLogsCollection = db.collection('fileAccessLogs');

    // Get all access logs for this file, sorted by most recent first
    const logs = await fileAccessLogsCollection
      .find({
        fileId: fileId
      })
      .sort({ timestamp: -1 })
      .limit(100) // Limit to 100 most recent entries
      .toArray();

    return res.json({
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
    console.error('Access logs fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});

