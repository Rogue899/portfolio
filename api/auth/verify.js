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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Verify it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    return res.status(200).json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

