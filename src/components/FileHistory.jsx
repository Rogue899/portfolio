import { useState, useEffect } from 'react';
import './FileHistory.css';

const FileHistory = ({ fileId, onClose, onRestore }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const apiUrl = import.meta.env.PROD 
          ? `/api/files/${fileId}/history`
          : `http://localhost:3001/api/files/${fileId}/history`;

        const response = await fetch(apiUrl, {
          headers: {
            'token': token,
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [fileId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="file-history-overlay" onClick={onClose}>
      <div className="file-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span className="modal-title">File History</span>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {loading && <div className="loading">Loading history...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && !error && history.length === 0 && (
            <div className="no-history">No history available for this file.</div>
          )}
          {!loading && !error && history.length > 0 && (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <span className="history-version">Version {item.version}</span>
                    <span className="history-date">{formatDate(item.savedAt)}</span>
                  </div>
                  <div className="history-content">
                    <pre>{item.content || '(empty)'}</pre>
                  </div>
                  {onRestore && (
                    <button
                      className="restore-button"
                      onClick={() => onRestore(item.content)}
                    >
                      Restore This Version
                    </button>
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

export default FileHistory;

