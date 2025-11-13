import { useState, useEffect } from 'react';
import './FileAccessLogs.css';

const FileAccessLogs = ({ fileId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const apiUrl = import.meta.env.PROD 
          ? `/api/files/${fileId}/access-logs`
          : `http://localhost:3001/api/files/${fileId}/access-logs`;

        const response = await fetch(apiUrl, {
          headers: {
            'token': token,
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - Authentication required');
          }
          throw new Error('Failed to fetch access logs');
        }

        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [fileId]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionMessage = (action) => {
    switch (action) {
      case 'create':
        return 'created this file';
      case 'edit':
        return 'edited this file';
      case 'view':
        return 'viewed this file';
      case 'delete':
        return 'deleted this file';
      default:
        return 'accessed this file';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return '📝';
      case 'edit':
        return '✏️';
      case 'view':
        return '👁️';
      case 'delete':
        return '🗑️';
      default:
        return '📄';
    }
  };

  // Generate a color for each IP address
  const getIPColor = (ip) => {
    if (!ip || ip === 'unknown') return '#9e9e9e';
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ip.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get a short name for the IP (last octet or first few chars)
  const getIPName = (ip) => {
    if (!ip || ip === 'unknown') return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `IP-${parts[3]}`;
    }
    return ip.substring(0, 8) + '...';
  };

  return (
    <div className="file-access-logs-overlay" onClick={onClose}>
      <div className="file-access-logs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span className="modal-title">Access Logs - Conversation View</span>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content conversation-view">
          {loading && <div className="loading">Loading access logs...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && !error && logs.length === 0 && (
            <div className="no-logs">No access logs available for this file.</div>
          )}
          {!loading && !error && logs.length > 0 && (
            <div className="conversation-container">
              {logs.map((log, index) => {
                const ipColor = getIPColor(log.ipAddress);
                const isSameIP = index > 0 && logs[index - 1].ipAddress === log.ipAddress;
                const showIPHeader = !isSameIP;
                
                return (
                  <div key={index} className={`conversation-message ${showIPHeader ? 'new-ip' : ''}`}>
                    {showIPHeader && (
                      <div className="message-header">
                        <div className="ip-avatar" style={{ backgroundColor: ipColor }}>
                          {getIPName(log.ipAddress).charAt(0)}
                        </div>
                        <div className="ip-info">
                          <div className="ip-name" style={{ color: ipColor }}>
                            {log.ipAddress || 'unknown'}
                          </div>
                          <div className="ip-user">
                            {log.userId === 'guest' ? 'Guest' : `User: ${log.userId.substring(0, 8)}...`}
                          </div>
                        </div>
                        <div className="message-time" title={formatFullDate(log.timestamp)}>
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                    )}
                    <div className="message-bubble" style={{ borderLeftColor: ipColor }}>
                      <div className="message-icon">{getActionIcon(log.action)}</div>
                      <div className="message-text">
                        <span className="message-action">{getActionMessage(log.action)}</span>
                        {log.fileName && log.action === 'create' && (
                          <span className="message-filename"> ({log.fileName})</span>
                        )}
                        {log.lengthChange !== null && log.lengthChange !== undefined && (
                          <span className="message-change" style={{ 
                            color: log.lengthChange > 0 ? '#4caf50' : log.lengthChange < 0 ? '#f44336' : '#666' 
                          }}>
                            {log.lengthChange > 0 ? ` +${log.lengthChange} chars` : log.lengthChange < 0 ? ` ${log.lengthChange} chars` : ' (no change)'}
                          </span>
                        )}
                        {log.fileSize !== null && log.fileSize !== undefined && (
                          <span className="message-size"> ({log.fileSize} chars)</span>
                        )}
                      </div>
                      {!showIPHeader && (
                        <div className="message-time-inline" title={formatFullDate(log.timestamp)}>
                          {formatTime(log.timestamp)}
                        </div>
                      )}
                    </div>
                    <div className="message-meta-container">
                      {log.browser && log.browser !== 'Unknown' && (
                        <div className="message-meta-item">
                          <span className="meta-label">Browser:</span> {log.browser}{log.browserVersion ? ` ${log.browserVersion}` : ''}
                        </div>
                      )}
                      {log.os && log.os !== 'Unknown' && (
                        <div className="message-meta-item">
                          <span className="meta-label">OS:</span> {log.os} {log.device && log.device !== 'Desktop' && `(${log.device})`}
                        </div>
                      )}
                      {log.referrer && (
                        <div className="message-meta-item" title={log.referrer}>
                          <span className="meta-label">From:</span> {log.referrer.length > 40 ? log.referrer.substring(0, 40) + '...' : log.referrer}
                        </div>
                      )}
                      {log.acceptLanguage && (
                        <div className="message-meta-item">
                          <span className="meta-label">Language:</span> {log.acceptLanguage.split(',')[0].split(';')[0]}
                        </div>
                      )}
                      {log.userAgent && (
                        <div className="message-meta-item" title={log.userAgent}>
                          <span className="meta-label">User Agent:</span> {log.userAgent.length > 50 ? log.userAgent.substring(0, 50) + '...' : log.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileAccessLogs;

