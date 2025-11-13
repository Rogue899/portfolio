import { useState, useEffect } from 'react';
import NotificationModal from './NotificationModal';
import FileHistory from './FileHistory';
import './FileEditor.css';

const FileEditor = ({ fileId, fileName, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load file content from backend
    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.PROD 
      ? `/api/files/${fileId}`
      : `http://localhost:3001/api/files/${fileId}`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      // Support both header formats (token header and Authorization Bearer)
      headers['token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(apiUrl, { headers })
      .then(res => {
        if (res.status === 404) {
          // File doesn't exist yet, start with empty content
          setContent('');
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to load file');
        return res.json();
      })
      .then(data => {
        if (data) {
          setContent(data.content || '');
        }
        setLoading(false);
      })
      .catch(error => {
        if (import.meta.env.DEV) {
          console.error('Error loading file:', error);
        }
        setContent('');
        setLoading(false);
      });
  }, [fileId]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.PROD 
      ? `/api/files/${fileId}`
      : `http://localhost:3001/api/files/${fileId}`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      // Support both header formats (token header and Authorization Bearer)
      headers['token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: fileName,
          content: content
        })
      });

      if (!response.ok) throw new Error('Failed to save file');
      
      setHasChanges(false);
      setSaving(false);
      setNotification({
        title: 'Success',
        message: 'File saved successfully!',
        type: 'success'
      });
      if (onSave) onSave();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error saving file:', error);
      }
      setSaving(false);
      setNotification({
        title: 'Error',
        message: 'Failed to save file. Please try again.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="file-editor">
        <div className="editor-loading">Loading file...</div>
      </div>
    );
  }

  return (
    <>
      <div className="file-editor">
        <div className="editor-toolbar">
          <div className="editor-title">
            <span className="editor-icon">📄</span>
            <span>{fileName}</span>
          </div>
          <div className="editor-actions">
            {hasChanges && <span className="unsaved-indicator">●</span>}
            {localStorage.getItem('authToken') && (
              <button 
                className="editor-history-btn" 
                onClick={() => setShowHistory(true)}
                title="View file history"
              >
                History
              </button>
            )}
            <button 
              className="editor-save-btn" 
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div className="editor-content">
          <textarea
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing..."
            spellCheck={false}
          />
        </div>
      </div>
      {notification && (
        <NotificationModal
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {showHistory && localStorage.getItem('authToken') && (
        <FileHistory
          fileId={fileId}
          onClose={() => setShowHistory(false)}
          onRestore={(restoredContent) => {
            setContent(restoredContent);
            setHasChanges(true);
            setShowHistory(false);
          }}
        />
      )}
    </>
  );
};

export default FileEditor;

