import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For Vercel, we'll use /tmp directory which is writable
const DATA_FILE = process.env.VERCEL 
  ? '/tmp/desktop-data.json' 
  : path.join(__dirname, '../desktop-data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ iconPositions: {}, desktopItems: [] }));
  } catch (error) {
    console.error('Error creating data file:', error);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return res.status(200).json(JSON.parse(data));
      } else {
        return res.status(200).json({ iconPositions: {}, desktopItems: [] });
      }
    } catch (error) {
      console.error('Error reading desktop data:', error);
      return res.status(200).json({ iconPositions: {}, desktopItems: [] });
    }
  }

  if (req.method === 'POST') {
    try {
      const { iconPositions, desktopItems } = req.body;
      const data = {
        iconPositions: iconPositions || {},
        desktopItems: desktopItems || []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return res.status(200).json({ success: true, message: 'Desktop data saved' });
    } catch (error) {
      console.error('Error saving desktop data:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

