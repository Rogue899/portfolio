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

// DELETE file
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

