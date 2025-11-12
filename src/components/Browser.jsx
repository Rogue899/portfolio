import { useState } from 'react';
import LinkedInProfile from './LinkedInProfile';
import GitHubProfile from './GitHubProfile';
import './Browser.css';

const Browser = () => {
  const [activeTab, setActiveTab] = useState('linkedin');

  return (
    <div className="browser">
      <div className="browser-toolbar">
        <div className="browser-tabs">
          <button 
            className={`browser-tab ${activeTab === 'linkedin' ? 'active' : ''}`}
            onClick={() => setActiveTab('linkedin')}
          >
            LinkedIn
          </button>
          <button 
            className={`browser-tab ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            GitHub
          </button>
        </div>
      </div>
      <div className="browser-content">
        {activeTab === 'linkedin' ? <LinkedInProfile /> : <GitHubProfile />}
      </div>
    </div>
  );
};

export default Browser;

