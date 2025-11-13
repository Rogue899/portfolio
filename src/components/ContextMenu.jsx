import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, onCreateFile, onCreateFolder, onRename, onDelete, onRefresh, isItemMenu }) => {
  return (
    <div 
      className="context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {isItemMenu ? (
        // Menu for existing items (rename, delete)
        <>
          <div className="context-menu-item" onClick={onRename}>
            <span className="context-menu-icon">✏️</span>
            <span>Rename</span>
          </div>
          {onDelete && (
            <div className="context-menu-item" onClick={onDelete}>
              <span className="context-menu-icon">🗑️</span>
              <span>Delete</span>
            </div>
          )}
        </>
      ) : (
        // Menu for desktop (create new, refresh)
        <>
          <div className="context-menu-item" onClick={onCreateFile}>
            <span className="context-menu-icon">📄</span>
            <span>New File</span>
          </div>
          <div className="context-menu-item" onClick={onCreateFolder}>
            <span className="context-menu-icon">📁</span>
            <span>New Folder</span>
          </div>
          {onRefresh && (
            <div className="context-menu-item" onClick={onRefresh}>
              <span className="context-menu-icon">🔄</span>
              <span>Refresh</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContextMenu;

