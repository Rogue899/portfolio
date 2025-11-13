import './FolderView.css';

const FolderView = ({ folderId, folderName, desktopItems, onItemDoubleClick, onItemDelete, onItemRename, onCreateFile, onCreateFolder }) => {
  // Filter items that belong to this folder
  const folderItems = desktopItems.filter(item => item.parentFolderId === folderId);

  return (
    <div className="folder-view">
      <div className="folder-header">
        <h2>{folderName}</h2>
      </div>
      <div className="folder-content">
        {folderItems.length === 0 ? (
          <div className="folder-empty">
            This folder is empty
            {(onCreateFile || onCreateFolder) && (
              <div className="folder-empty-actions">
                {onCreateFile && (
                  <button className="folder-action-btn" onClick={() => onCreateFile(folderId)}>
                    Create File
                  </button>
                )}
                {onCreateFolder && (
                  <button className="folder-action-btn" onClick={() => onCreateFolder(folderId)}>
                    Create Folder
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="folder-items">
            {folderItems.map(item => (
              <div
                key={item.id}
                className="folder-item"
                onDoubleClick={() => onItemDoubleClick(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  // Context menu could be added here
                }}
              >
                <div className="folder-item-icon">
                  {item.type === 'file' ? '📄' : '📁'}
                </div>
                <div className="folder-item-name">{item.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderView;

