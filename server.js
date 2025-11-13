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

    // Try to find file for authenticated user first, then guest
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
    const { fileName, content, password, unlockPassword } = req.body;

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

    // Check if file is locked and password is provided for unlock
    const existingFile = await filesCollection.findOne({
      fileId: fileId
    });

    if (existingFile && existingFile.passwordHash) {
      // File is locked - check password
      if (!unlockPassword) {
        return res.status(403).json({ 
          error: 'File is password protected',
          isLocked: true 
        });
      }
      
      const isValidPassword = await bcrypt.compare(unlockPassword, existingFile.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Incorrect password',
          isLocked: true 
        });
      }
    }

    // Only save history for authenticated users (userId used ONLY for history)
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

    // Update or create file (files are completely public - no userId stored or filtered)
    const version = existingFile ? (existingFile.version || 1) + 1 : 1;
    
    // Handle password: if provided, hash it; if empty string, remove it
    let passwordHash = existingFile?.passwordHash || null;
    if (password !== undefined) {
      if (password && password.trim() !== '') {
        passwordHash = await bcrypt.hash(password, 10);
      } else {
        // Empty password means remove password protection
        passwordHash = null;
      }
    }
    
    const updateData = {
      fileName: fileName,
      content: content || '',
      updatedAt: new Date(),
      version: version
    };
    
    if (passwordHash) {
      updateData.passwordHash = passwordHash;
    } else if (password !== undefined) {
      // Explicitly remove password if it was set to empty
      updateData.passwordHash = null;
    }
    
    await filesCollection.updateOne(
      {
        fileId: fileId
      },
      {
        $set: updateData,
        $unset: {
          userId: "", // Remove userId field if it exists (for existing files)
          ...(passwordHash === null && password !== undefined ? { passwordHash: "" } : {}) // Remove password if explicitly set to null
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

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

    await filesCollection.deleteOne({
      fileId: fileId,
      userId: userId
    });

    await fileHistoryCollection.deleteMany({
      fileId: fileId,
      userId: userId
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});

