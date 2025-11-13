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
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [filePassword, setFilePassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

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
          setIsLocked(data.isLocked || false);
          if (data.isLocked) {
            // File is locked - show password prompt
            setShowPasswordPrompt(true);
            setContent('');
          } else {
            // File is unlocked - show content and prompt to set password if empty
            setContent(data.content || '');
            if (!data.content || data.content.trim() === '') {
              // New/empty file - prompt to set password
              setShowPasswordDialog(true);
            }
          }
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

  const handleUnlock = async () => {
    if (!unlockPassword.trim()) {
      setNotification({
        title: 'Error',
        message: 'Please enter a password',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.PROD 
      ? `/api/files/${fileId}`
      : `http://localhost:3001/api/files/${fileId}`;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      // Try to save with unlock password to verify it
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: fileName,
          content: content,
          unlockPassword: unlockPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.isLocked) {
          setNotification({
            title: 'Error',
            message: data.error || 'Incorrect password',
            type: 'error'
          });
          setSaving(false);
          return;
        }
        throw new Error(data.error || 'Failed to unlock file');
      }
      
      // Password correct - fetch content with password
      const getResponse = await fetch(`${apiUrl}?unlockPassword=${encodeURIComponent(unlockPassword)}`, { headers });
      const fileData = await getResponse.json();
      
      if (fileData.error) {
        setNotification({
          title: 'Error',
          message: fileData.error || 'Failed to unlock file',
          type: 'error'
        });
        setSaving(false);
        return;
      }
      
      setContent(fileData.content || '');
      setIsLocked(true); // Still locked, but we have the password
      setShowPasswordPrompt(false);
      // Keep unlockPassword in state so we can use it for saving
      setSaving(false);
    } catch (error) {
      setSaving(false);
      setNotification({
        title: 'Error',
        message: 'Failed to unlock file. Please try again.',
        type: 'error'
      });
    }
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
      headers['token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const body = {
        fileName: fileName,
        content: content
      };

      // Include unlock password if file is locked
      if (isLocked && unlockPassword) {
        body.unlockPassword = unlockPassword;
      }

      // Include password if it was set in the dialog
      if (filePassword) {
        body.password = filePassword;
        setFilePassword(''); // Clear after using
      }
    
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isLocked) {
          setNotification({
            title: 'Error',
            message: data.error || 'Incorrect password',
            type: 'error'
          });
          setSaving(false);
          return;
        }
        throw new Error(data.error || 'Failed to save file');
      }
      
      // If password was set, update locked state
      if (filePassword) {
        setIsLocked(true);
        setFilePassword('');
        setShowPasswordDialog(false);
      }
      
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

  if (showPasswordPrompt && isLocked) {
    return (
      <div className="file-editor">
        <div className="editor-toolbar">
          <div className="editor-title">
            <span className="editor-icon">🔒</span>
            <span>{fileName} (Locked)</span>
          </div>
        </div>
        <div className="editor-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
            <h3>This file is password protected</h3>
            <p>Enter the password to unlock and edit</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Enter password"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              style={{ padding: '10px', fontSize: '14px' }}
              autoFocus
            />
            <button 
              className="editor-save-btn" 
              onClick={handleUnlock}
              disabled={saving || !unlockPassword.trim()}
            >
              {saving ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="file-editor">
        <div className="editor-toolbar">
          <div className="editor-title">
            <span className="editor-icon">{isLocked ? '🔒' : '📄'}</span>
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
      {showPasswordDialog && (
        <div className="modal-overlay" onClick={() => {
          // Don't allow closing by clicking outside - must set password or skip
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>🔒 Set Password</h3>
            <p>Protect this file with a password. You can skip this step.</p>
            <input
              type="password"
              value={filePassword}
              onChange={(e) => setFilePassword(e.target.value)}
              placeholder="Enter password (optional)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setShowPasswordDialog(false);
                  if (filePassword) {
                    setIsLocked(true);
                  }
                }
              }}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '14px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => {
                setShowPasswordDialog(false);
                setFilePassword('');
              }}>Skip</button>
              <button 
                className="editor-save-btn"
                onClick={() => {
                  setShowPasswordDialog(false);
                  if (filePassword) {
                    setIsLocked(true);
                  }
                }}
              >
                Set Password
              </button>
            </div>
          </div>
        </div>
      )}
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

