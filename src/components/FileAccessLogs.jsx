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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return '#4caf50';
      case 'edit':
        return '#2196f3';
      case 'view':
        return '#9e9e9e';
      case 'delete':
        return '#f44336';
      default:
        return '#000';
    }
  };

  return (
    <div className="file-access-logs-overlay" onClick={onClose}>
      <div className="file-access-logs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span className="modal-title">Access Logs</span>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {loading && <div className="loading">Loading access logs...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && !error && logs.length === 0 && (
            <div className="no-logs">No access logs available for this file.</div>
          )}
          {!loading && !error && logs.length > 0 && (
            <div className="logs-list">
              <div className="logs-header">
                <div className="log-column">Action</div>
                <div className="log-column">IP Address</div>
                <div className="log-column">User</div>
                <div className="log-column">Timestamp</div>
              </div>
              {logs.map((log, index) => (
                <div key={index} className="log-item">
                  <div className="log-action" style={{ color: getActionColor(log.action) }}>
                    <span className="log-icon">{getActionIcon(log.action)}</span>
                    <span className="log-action-text">{log.action.toUpperCase()}</span>
                  </div>
                  <div className="log-ip">{log.ipAddress || 'unknown'}</div>
                  <div className="log-user">{log.userId === 'guest' ? 'Guest' : log.userId}</div>
                  <div className="log-timestamp">{formatDate(log.timestamp)}</div>
                  {log.userAgent && (
                    <div className="log-user-agent" title={log.userAgent}>
                      {log.userAgent.length > 50 ? log.userAgent.substring(0, 50) + '...' : log.userAgent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileAccessLogs;

