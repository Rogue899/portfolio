import connectToDatabase from '../lib/mongodb.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('MongoDB not available, using fallback');
      return res.status(200).json({ iconPositions: {}, desktopItems: [] });
    }

    const desktopCollection = db.collection('desktop');

    if (req.method === 'GET') {
      try {
        // Get the single desktop document (we only store one)
        const data = await desktopCollection.findOne({ _id: 'desktop_state' });
        if (data) {
          return res.status(200).json({
            iconPositions: data.iconPositions || {},
            desktopItems: data.desktopItems || []
          });
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
          _id: 'desktop_state',
          iconPositions: iconPositions || {},
          desktopItems: desktopItems || [],
          updatedAt: new Date()
        };
        
        // Upsert the desktop state
        await desktopCollection.updateOne(
          { _id: 'desktop_state' },
          { $set: data },
          { upsert: true }
        );
        
        return res.status(200).json({ success: true, message: 'Desktop data saved' });
      } catch (error) {
        console.error('Error saving desktop data:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Desktop API error:', error);
    // Fallback to empty state if MongoDB fails
    if (req.method === 'GET') {
      return res.status(200).json({ iconPositions: {}, desktopItems: [] });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}

