import { useState, useEffect } from 'react';
import './GitHubProfile.css';

const GitHubProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const username = 'Rogue899';

  useEffect(() => {
    // Fetch GitHub profile data
    fetch(`https://api.github.com/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setProfileData({
          login: data.login,
          name: data.name || data.login,
          bio: data.bio || 'Software Developer',
          avatar_url: data.avatar_url,
          followers: data.followers,
          following: data.following,
          public_repos: data.public_repos,
          location: data.location,
          blog: data.blog,
          html_url: data.html_url,
          company: data.company
        });
        setLoading(false);
      })
      .catch(error => {
        if (import.meta.env.DEV) {
          console.error('Error fetching GitHub profile:', error);
        }
        // Fallback data
        setProfileData({
          login: username,
          name: 'Tarek Roukos',
          bio: 'Software Developer',
          avatar_url: null,
          followers: 0,
          following: 0,
          public_repos: 0,
          location: 'Beirut, Lebanon',
          html_url: `https://github.com/${username}`,
          company: null
        });
        setLoading(false);
      });
  }, [username]);

  if (loading || !profileData) {
    return (
      <div className="github-profile">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="github-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.avatar_url ? (
            <img src={profileData.avatar_url} alt={profileData.name} />
          ) : (
            <div className="avatar-placeholder">{profileData.name.charAt(0)}</div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profileData.name}</h1>
          <p className="profile-username">@{profileData.login}</p>
          {profileData.bio && <p className="profile-bio">{profileData.bio}</p>}
          {profileData.location && (
            <p className="profile-location">📍 {profileData.location}</p>
          )}
          {profileData.company && (
            <p className="profile-company">🏢 {profileData.company}</p>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <div className="stat-number">{profileData.public_repos}</div>
          <div className="stat-label">Repositories</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{profileData.followers}</div>
          <div className="stat-label">Followers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{profileData.following}</div>
          <div className="stat-label">Following</div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>About</h2>
          <p>
            Software developer with experience in React, JavaScript, TypeScript, and full-stack development.
            Passionate about building modern web applications and contributing to open-source projects.
          </p>
        </div>

        <div className="profile-section">
          <h2>Technologies</h2>
          <div className="tech-list">
            {['React', 'JavaScript', 'TypeScript', 'Node.js', 'C#', 'Angular', 'Git'].map((tech, idx) => (
              <span key={idx} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>

        <div className="profile-footer">
          <a 
            href={profileData.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-full-profile"
          >
            View Full Profile on GitHub →
          </a>
        </div>
      </div>
    </div>
  );
};

export default GitHubProfile;

