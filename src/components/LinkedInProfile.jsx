import { useState, useEffect } from 'react';
import './LinkedInProfile.css';

const LinkedInProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const profileUrl = 'https://www.linkedin.com/in/tarek-roukos-60058a9b';

  useEffect(() => {
    // LinkedIn doesn't have a public API like GitHub
    // Fetch from our backend API which has accurate CV data
    const apiUrl = import.meta.env.PROD 
      ? '/api/linkedin-profile'
      : 'http://localhost:3001/api/linkedin-profile';
    
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProfileData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching LinkedIn profile:', error);
        // Fallback to accurate LinkedIn data
        setProfileData({
          name: 'Tarek Roukos',
          headline: 'Senior Software Engineer',
          location: 'Beirut, Lebanon',
          profileUrl: profileUrl,
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
        });
        setLoading(false);
      });
  }, [profileUrl]);

  if (loading || !profileData) {
    return (
      <div className="linkedin-profile">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="linkedin-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">TR</div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profileData.name}</h1>
          <p className="profile-headline">{profileData.headline}</p>
          <p className="profile-location">📍 {profileData.location}</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>About</h2>
          <p>{profileData.summary}</p>
        </div>

        <div className="profile-section">
          <h2>Experience</h2>
          {profileData.experience.map((exp, idx) => (
            <div key={idx} className="experience-item">
              <h3>{exp.title}</h3>
              <p className="company">{exp.company}</p>
              <p className="period">{exp.period} • {exp.location}</p>
            </div>
          ))}
        </div>

        <div className="profile-section">
          <h2>Skills</h2>
          <div className="skills-list">
            {profileData.skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>

        <div className="profile-footer">
          <a 
            href={profileData.profileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-full-profile"
          >
            View Full Profile on LinkedIn →
          </a>
        </div>
      </div>
    </div>
  );
};

export default LinkedInProfile;

