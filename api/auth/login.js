import connectToDatabase from '../../lib/mongodb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
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
      return res.status(500).json({ 
        error: 'MongoDB connection failed',
        message: error.message 
      });
    }
    
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT tokens matching your system
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is missing from environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const jwtIssuer = process.env.JWT_ISSUER || 'swiftserve';
    const jwtAudience = process.env.JWT_AUDIENCE || 'swiftserve-users';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '7d';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    // Access token payload
    const accessTokenPayload = {
      id: user._id.toString(),
      type: 'access',
      email: user.email
    };

    // Refresh token payload
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

    return res.status(200).json({
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
      console.error('Error stack:', error.stack);
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

