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
            setShowPasswordPrompt(true);
            setContent('');
          } else {
            setContent(data.content || '');
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
      
      // Password correct - file is now unlocked, reload content
      const getResponse = await fetch(apiUrl, { headers });
      const fileData = await getResponse.json();
      
      if (fileData.isLocked) {
        // Still locked - need to fetch with unlock password
        // Actually, we just unlocked it by saving, so it should be unlocked now
        // Let's try fetching again
        const retryResponse = await fetch(apiUrl, { headers });
        const retryData = await retryResponse.json();
        setContent(retryData.content || '');
        setIsLocked(retryData.isLocked || false);
      } else {
        setContent(fileData.content || '');
        setIsLocked(false);
      }
      
      setShowPasswordPrompt(false);
      setUnlockPassword('');
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

      // Include password if setting/changing password
      if (filePassword) {
        body.password = filePassword;
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
            <button 
              className="editor-history-btn" 
              onClick={() => setShowPasswordDialog(true)}
              title={isLocked ? "Change password" : "Set password"}
            >
              {isLocked ? '🔒 Change Password' : '🔓 Set Password'}
            </button>
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
        <div className="modal-overlay" onClick={() => setShowPasswordDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>{isLocked ? 'Change Password' : 'Set Password'}</h3>
            <p>Enter a password to protect this file. Leave empty to remove password.</p>
            <input
              type="password"
              value={filePassword}
              onChange={(e) => setFilePassword(e.target.value)}
              placeholder="Enter password (leave empty to unlock)"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => {
                setShowPasswordDialog(false);
                setFilePassword('');
              }}>Cancel</button>
              <button 
                className="editor-save-btn"
                onClick={async () => {
                  // Save password change immediately
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
                      content: content,
                      password: filePassword || '' // Empty string to remove password
                    };

                    if (isLocked && unlockPassword) {
                      body.unlockPassword = unlockPassword;
                    }

                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(body)
                    });

                    if (response.ok) {
                      setIsLocked(!!filePassword);
                      setShowPasswordDialog(false);
                      setFilePassword('');
                      setNotification({
                        title: 'Success',
                        message: filePassword ? 'Password set successfully!' : 'Password removed successfully!',
                        type: 'success'
                      });
                    } else {
                      const data = await response.json();
                      setNotification({
                        title: 'Error',
                        message: data.error || 'Failed to update password',
                        type: 'error'
                      });
                    }
                  } catch (error) {
                    setNotification({
                      title: 'Error',
                      message: 'Failed to update password',
                      type: 'error'
                    });
                  }
                }}
              >
                {isLocked && !filePassword ? 'Remove Password' : 'Set Password'}
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

