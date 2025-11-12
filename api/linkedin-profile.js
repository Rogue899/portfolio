// Vercel serverless function to fetch LinkedIn profile data
// Note: LinkedIn doesn't have a public API, so this would need to use
// LinkedIn's official API with OAuth, or scrape (which violates ToS)
// For now, we'll return structured data that matches the CV

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // LinkedIn doesn't provide a public API for profile data
    // This would require LinkedIn API with OAuth authentication
    // For now, return structured data that matches the CV
    
    const profileData = {
      name: 'Tarek Roukos',
      headline: 'Senior Web Developer',
      location: 'Beirut, Lebanon',
      profileUrl: 'https://www.linkedin.com/in/tarek-roukos-60058a9b',
      summary: 'Experienced web developer specializing in React, SharePoint, and enterprise solutions. Passionate about building modern web applications and contributing to innovative projects.',
      experience: [
        {
          title: 'Senior Web Developer',
          company: 'Born Interactive',
          period: '2025–Present',
          location: 'Beirut, Lebanon'
        },
        {
          title: 'Software Engineer Level 2',
          company: 'SerVme',
          period: '2021–2025',
          location: 'Beirut, Lebanon'
        },
        {
          title: 'Junior Software Engineer',
          company: 'CME',
          period: '2019–2020',
          location: 'Beirut, Lebanon'
        }
      ],
      skills: ['React.js', 'JavaScript', 'TypeScript', 'SharePoint', 'C#', 'Angular', 'Node.js', 'Redux', 'GraphQL', 'Docker', 'Kubernetes']
    };

    return res.status(200).json(profileData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

