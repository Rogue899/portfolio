import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'desktop-data.json');

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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

