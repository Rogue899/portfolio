import { useState, useEffect } from 'react';
import './LinkedInProfile.css';

const LinkedInProfile = () => {
  const [loading, setLoading] = useState(true);
  const profileData = {
    name: 'Tarek Roukos',
    headline: 'Senior Web Developer',
    location: 'Beirut, Lebanon',
    profileUrl: 'https://www.linkedin.com/in/tarek-roukos-60058a9b',
    summary: 'Experienced web developer specializing in React, SharePoint, and enterprise solutions.',
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
    skills: ['React.js', 'JavaScript', 'TypeScript', 'SharePoint', 'C#', 'Angular', 'Node.js']
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
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

