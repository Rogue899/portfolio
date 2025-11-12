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
      headline: 'Senior Software Engineer',
      location: 'Beirut, Lebanon',
      profileUrl: 'https://www.linkedin.com/in/tarek-roukos-60058a9b',
      summary: 'Software Engineer with over 3 years of experience at SerVme (fully remote), specializing in front-end development using AngularJS and React. Skilled in managing and implementing complex features, debugging, and enhancing performance in large-scale applications.',
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Born Interactive',
          period: 'Apr 2025 - Present · 8 mos',
          location: 'On-site'
        },
        {
          title: 'Software Engineer lvl 2',
          company: 'serVme',
          period: 'May 2021 - Jan 2025 · 3 yrs 9 mos',
          location: 'Lebanon · Remote'
        },
        {
          title: 'Full Stack Engineer',
          company: 'Lemonade Fashion',
          period: 'Mar 2021 - Sep 2021 · 7 mos',
          location: 'Contract'
        },
        {
          title: 'Software Engineer',
          company: 'CME Offshore sal',
          period: 'Dec 2019 - Dec 2020 · 1 yr 1 mo',
          location: 'Lebanon'
        }
      ],
      skills: ['TypeScript', 'React.js', 'JavaScript', 'AngularJS', 'Angular', 'Node.js', 'Leadership', 'Android Development', 'Reactjs', 'Full Stack Development']
    };

    return res.status(200).json(profileData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

