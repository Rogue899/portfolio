import { useState } from 'react';
import './RecycleBin.css';

const RecycleBin = ({ onDrop, onDoubleClick }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're actually leaving the recycle bin area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const itemId = e.dataTransfer.getData('text/plain');
    
    if (itemId && onDrop) {
      onDrop(itemId);
    }
    
    // Clear the drag data
    e.dataTransfer.clearData();
  };

  return (
    <div
      className={`recycle-bin ${isDraggingOver ? 'dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDoubleClick={onDoubleClick}
    >
      <div className="recycle-bin-icon">🗑️</div>
      <div className="recycle-bin-label">Recycle Bin</div>
    </div>
  );
};

export default RecycleBin;

