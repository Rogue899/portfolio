export default async function handler(req, res) {
  // Test endpoint to check if environment variables are loaded
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const hasMongoUri = !!process.env.MONGODB_URI;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  
  return res.status(200).json({
    mongodb_uri_set: hasMongoUri,
    jwt_secret_set: hasJwtSecret,
    mongodb_uri_length: hasMongoUri ? process.env.MONGODB_URI.length : 0,
    jwt_secret_length: hasJwtSecret ? process.env.JWT_SECRET.length : 0,
    node_env: process.env.NODE_ENV
  });
}

