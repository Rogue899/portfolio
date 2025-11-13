import { useState, useEffect, useRef } from 'react';
import './WindowsXPDesktop.css';
import PortfolioBook from './PortfolioBook';
import ProjectFolder from './ProjectFolder';
import FileEditor from './FileEditor';
import ContextMenu from './ContextMenu';
import TicTacToe from './TicTacToe';
import Pong from './Pong';
import RecycleBin from './RecycleBin';
import Browser from './Browser';
import DeleteConfirmModal from './DeleteConfirmModal';
import NotificationModal from './NotificationModal';
import Confetti from './Confetti';

const WindowsXPDesktop = () => {
  const [openWindows, setOpenWindows] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [iconPositions, setIconPositions] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [desktopItems, setDesktopItems] = useState([]);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [shutdownConfirm, setShutdownConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedIcons, setSelectedIcons] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const [theme, setTheme] = useState('pink'); // classic-blue, bliss, berserker, pink
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [clipboard, setClipboard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const dragState = useRef({ isDragging: false, windowId: null, offsetX: 0, offsetY: 0 });
  const iconDragState = useRef({ isDragging: false, iconId: null, offsetX: 0, offsetY: 0, hasMoved: false });
  const selectionState = useRef({ isSelecting: false, startX: 0, startY: 0 });

  const openWindow = (id, title, content) => {
    // Special handling for portfolio - open as fullscreen book
    if (id === 'portfolio') {
      setIsBookOpen(true);
      setStartMenuOpen(false);
      return;
    }
    
    // Check if window is already open
    if (openWindows.find(w => w.id === id)) {
      bringToFront(id);
      return;
    }
    
    // Detect mobile devices
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setOpenWindows(prev => [...prev, { 
      id, 
      title, 
      content, 
      zIndex: prev.length,
      x: isMobile ? 0 : window.innerWidth / 2 - 500,
      y: isMobile ? 0 : window.innerHeight / 2 - 350,
      isMaximized: isMobile, // Auto-maximize on mobile
      savedPosition: { x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 350 },
      savedSize: { width: 1000, height: 700 },
      width: 1000,
      height: 700
    }]);
    setStartMenuOpen(false);
  };

  const closeWindow = (id) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
  };

  const bringToFront = (id) => {
    setOpenWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), -1);
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  };

  const toggleMaximize = (id) => {
    setOpenWindows(prev => prev.map(w => {
      if (w.id === id) {
        if (w.isMaximized) {
          // Restore
          return {
            ...w,
            isMaximized: false,
            x: w.savedPosition.x,
            y: w.savedPosition.y,
            width: w.savedSize.width,
            height: w.savedSize.height
          };
        } else {
          // Maximize
          return {
            ...w,
            isMaximized: true,
            savedPosition: { x: w.x || window.innerWidth / 2 - 500, y: w.y || window.innerHeight / 2 - 350 },
            savedSize: { width: w.width || 1000, height: w.height || 700 }
          };
        }
      }
      return w;
    }));
  };

  const resizeState = useRef({ isResizing: false, windowId: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0, resizeDirection: '' });

  const handleResizeMouseDown = (e, windowId, direction) => {
    e.stopPropagation();
    const window = openWindows.find(w => w.id === windowId);
    if (!window || window.isMaximized) return;

    bringToFront(windowId);
    const rect = e.currentTarget.closest('.window').getBoundingClientRect();
    
    resizeState.current = {
      isResizing: true,
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: window.width || 1000,
      startHeight: window.height || 700,
      startLeft: window.x || rect.left,
      startTop: window.y || rect.top,
      resizeDirection: direction
    };

    const handleMouseMove = (e) => {
      if (!resizeState.current.isResizing) return;

      const deltaX = e.clientX - resizeState.current.startX;
      const deltaY = e.clientY - resizeState.current.startY;
      const state = resizeState.current;
      const direction = state.resizeDirection;

      let newWidth = state.startWidth;
      let newHeight = state.startHeight;
      let newX = state.startLeft;
      let newY = state.startTop;

      if (direction.includes('right')) {
        newWidth = Math.max(400, state.startWidth + deltaX);
      }
      if (direction.includes('left')) {
        newWidth = Math.max(400, state.startWidth - deltaX);
        newX = state.startLeft + deltaX;
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(300, state.startHeight + deltaY);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(300, state.startHeight - deltaY);
        newY = state.startTop + deltaY;
      }

      setOpenWindows(prev => prev.map(w => {
        if (w.id === state.windowId) {
          return {
            ...w,
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
            savedSize: { width: newWidth, height: newHeight }
          };
        }
        return w;
      }));
    };

    const handleMouseUp = () => {
      resizeState.current.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleShutdown = () => {
    setShutdownConfirm(true);
  };

  const confirmShutdown = () => {
    setShutdownConfirm(false);
    window.close();
    // If window.close() doesn't work (some browsers block it), show a message
    setTimeout(() => {
      if (!document.hidden) {
        setNotification({
          title: 'Information',
          message: 'Please close this tab/window manually.',
          type: 'info'
        });
      }
    }, 100);
  };

  const cancelShutdown = () => {
    setShutdownConfirm(false);
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Window dragging handlers
  const handleMouseDown = (e, windowId) => {
    if (e.target.closest('.window-close') || 
        e.target.closest('.window-maximize') ||
        e.target.closest('.window-content') ||
        e.target.closest('.resize-handle')) return;
    const window = openWindows.find(w => w.id === windowId);
    if (!window || window.isMaximized) return;
    
    bringToFront(windowId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragState.current = {
      isDragging: true,
      windowId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    const handleMouseMove = (e) => {
      if (!dragState.current.isDragging) return;
      
      setOpenWindows(prev => prev.map(w => {
        if (w.id === dragState.current.windowId) {
          return {
            ...w,
            x: e.clientX - dragState.current.offsetX,
            y: e.clientY - dragState.current.offsetY
          };
        }
        return w;
      }));
    };

    const handleMouseUp = () => {
      dragState.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Load saved data from backend
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Use relative path for Vercel deployment, fallback to localhost for dev
    const apiUrl = import.meta.env.PROD 
      ? '/api/desktop'
      : 'http://localhost:3001/api/desktop';
    
    fetch(apiUrl, { 
      signal: controller.signal,
      mode: 'cors'
    })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Backend not available');
        return res.json();
      })
      .then(data => {
        if (data.iconPositions) {
          setIconPositions(data.iconPositions);
        }
        if (data.desktopItems) {
          // Check if gift file already exists
          const hasGift = data.desktopItems.some(item => item.id === 'gift-file');
          if (!hasGift) {
            // Add gift file if it doesn't exist
            const giftFile = {
              id: 'gift-file',
              name: 'gift',
              type: 'file',
              x: 120,
              y: 20
            };
            setDesktopItems([...data.desktopItems, giftFile]);
            setIconPositions(prev => ({
              ...prev,
              'gift-file': { x: 120, y: 20 }
            }));
          } else {
            setDesktopItems(data.desktopItems);
          }
        } else {
          // No desktop items, add gift file
          const giftFile = {
            id: 'gift-file',
            name: 'gift',
            type: 'file',
            x: 120,
            y: 20
          };
          setDesktopItems([giftFile]);
          setIconPositions(prev => ({
            ...prev,
            'gift-file': { x: 120, y: 20 }
          }));
        }
      })
      .catch(() => {
        // Silently use defaults if backend not available
        const initialPositions = {
          portfolio: { x: 20, y: 20 },
          rickmorty: { x: 20, y: 100 },
          frontend: { x: 20, y: 180 },
          tictactoe: { x: 20, y: 260 },
          pong: { x: 20, y: 340 },
          browser: { x: 20, y: 420 },
          recyclebin: { x: window.innerWidth - 100, y: window.innerHeight - 120 },
          'gift-file': { x: 120, y: 20 }
        };
        setIconPositions(initialPositions);
        // Add gift file to desktop items
        const giftFile = {
          id: 'gift-file',
          name: 'gift',
          type: 'file',
          x: 120,
          y: 20
        };
        setDesktopItems([giftFile]);
      });
    
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Save to backend when positions change (with debounce and error handling)
  useEffect(() => {
    if (Object.keys(iconPositions).length === 0 && desktopItems.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 1000);
      
      const apiUrl = import.meta.env.PROD 
        ? '/api/desktop'
        : 'http://localhost:3001/api/desktop';
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconPositions, desktopItems }),
        signal: controller.signal,
        mode: 'cors'
      })
      .then(() => clearTimeout(fetchTimeout))
      .catch(() => {
        // Silently fail if backend not available
      });
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [iconPositions, desktopItems]);

  // Define projects array before useEffect that uses it
  const projects = [
    { 
      id: 'rickmorty', 
      title: 'Rick & Morty Explorer', 
      description: 'Character explorer app',
      url: 'https://rick-and-morty-explorer-woad.vercel.app/',
      type: 'iframe'
    },
    { 
      id: 'frontend', 
      title: 'Frontend Project', 
      description: 'Frontend showcase',
      url: 'https://frontend-nine-iota-66.vercel.app/',
      type: 'iframe'
    },
    { 
      id: 'tictactoe', 
      title: 'Tic Tac Toe', 
      description: 'Classic Tic Tac Toe game',
      type: 'game',
      component: <TicTacToe />
    },
    { 
      id: 'pong', 
      title: 'Pong', 
      description: 'Classic Pong game',
      type: 'game',
      component: <Pong />
    },
    { 
      id: 'browser', 
      title: 'Browser', 
      description: 'Web browser',
      type: 'browser',
      component: <Browser />
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || editingItem) {
        return;
      }

      // Ctrl+A - Select all icons
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIconIds = new Set([
          'portfolio',
          ...projects.map(p => p.id),
          ...desktopItems.map(item => item.id)
        ]);
        setSelectedIcons(allIconIds);
      }

      // Delete - Delete selected items
      if (e.key === 'Delete' && selectedIcons.size > 0) {
        e.preventDefault();
        const itemsToDelete = Array.from(selectedIcons).filter(id => 
          id !== 'portfolio' && !projects.some(p => p.id === id)
        );
        if (itemsToDelete.length > 0) {
          setDeleteConfirm({
            itemId: itemsToDelete[0],
            itemName: itemsToDelete.length === 1 
              ? (desktopItems.find(i => i.id === itemsToDelete[0])?.name || 'item')
              : `${itemsToDelete.length} items`,
            allItems: itemsToDelete
          });
        }
      }

      // F2 - Rename selected item
      if (e.key === 'F2' && selectedIcons.size === 1) {
        e.preventDefault();
        const selectedId = Array.from(selectedIcons)[0];
        const item = desktopItems.find(i => i.id === selectedId);
        if (item) {
          setEditingItem(selectedId);
          setEditValue(item.name);
        }
      }

      // Ctrl+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIcons.size > 0) {
        e.preventDefault();
        const itemsToCopy = Array.from(selectedIcons)
          .map(id => desktopItems.find(item => item.id === id))
          .filter(Boolean);
        if (itemsToCopy.length > 0) {
          setClipboard({ type: 'copy', items: itemsToCopy });
        }
      }

      // Ctrl+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        if (clipboard.items && clipboard.items.length > 0) {
          clipboard.items.forEach(item => {
            if (clipboard.type === 'copy') {
              // Copy: create new items
              const newId = `${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const newItem = {
                ...item,
                id: newId,
                x: (item.x || 20) + 20,
                y: (item.y || 20) + 20
              };
              setDesktopItems(prev => [...prev, newItem]);
              setIconPositions(prev => ({
                ...prev,
                [newId]: { x: newItem.x, y: newItem.y }
              }));
            } else if (clipboard.type === 'cut') {
              // Cut: move existing items
              const currentPos = iconPositions[item.id] || { x: item.x || 20, y: item.y || 20 };
              setIconPositions(prev => ({
                ...prev,
                [item.id]: { x: currentPos.x + 20, y: currentPos.y + 20 }
              }));
            }
          });
          
          // Delete items if cut
          if (clipboard.type === 'cut') {
            const itemsToDelete = clipboard.items.map(item => item.id);
            const updatedItems = desktopItems.filter(i => !itemsToDelete.includes(i.id));
            setDesktopItems(updatedItems);
            const updatedPositions = { ...iconPositions };
            itemsToDelete.forEach(id => {
              const currentPos = iconPositions[id] || { x: 20, y: 20 };
              updatedPositions[id] = { x: currentPos.x + 20, y: currentPos.y + 20 };
            });
            setIconPositions(updatedPositions);
          }
          
          setClipboard(null);
        }
      }

      // Ctrl+X - Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedIcons.size > 0) {
        e.preventDefault();
        const itemsToCut = Array.from(selectedIcons)
          .map(id => desktopItems.find(item => item.id === id))
          .filter(Boolean);
        if (itemsToCut.length > 0) {
          setClipboard({ type: 'cut', items: itemsToCut });
        }
      }

      // Escape - Deselect all
      if (e.key === 'Escape') {
        setSelectedIcons(new Set());
        setSelectionBox(null);
        setStartMenuOpen(false);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIcons, desktopItems, clipboard, editingItem, projects, iconPositions]);

  // Icon dragging handlers
  const handleIconMouseDown = (e, iconId) => {
    // Don't interfere with drag and drop for files/folders
    const isDesktopItem = desktopItems.some(item => item.id === iconId);
    if (isDesktopItem) {
      // Let native drag and drop handle it
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    
    iconDragState.current = {
      isDragging: false,
      iconId,
      offsetX: 0,
      offsetY: 0,
      hasMoved: false,
      startX,
      startY
    };

    const handleMouseMove = (e) => {
      if (!iconDragState.current.iconId) return;
      
      const deltaX = Math.abs(e.clientX - iconDragState.current.startX);
      const deltaY = Math.abs(e.clientY - iconDragState.current.startY);
      
      if (deltaX > 5 || deltaY > 5) {
        if (!iconDragState.current.isDragging) {
          iconDragState.current.isDragging = true;
          iconDragState.current.hasMoved = true;
          const icon = document.querySelector(`[data-icon-id="${iconId}"]`);
          if (icon) {
            const rect = icon.getBoundingClientRect();
            iconDragState.current.offsetX = e.clientX - rect.left;
            iconDragState.current.offsetY = e.clientY - rect.top;
          }
        }
        
        if (iconDragState.current.isDragging) {
          const desktopRect = document.querySelector('.desktop-background')?.getBoundingClientRect();
          if (desktopRect) {
            let newX = e.clientX - desktopRect.left - iconDragState.current.offsetX;
            let newY = e.clientY - desktopRect.top - iconDragState.current.offsetY;
            
            // Snap to grid if enabled
            if (snapToGrid) {
              const gridSize = 20;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
            }
            
            // Constrain to desktop bounds
            const constrainedX = Math.max(0, Math.min(newX, desktopRect.width - 80));
            const constrainedY = Math.max(0, Math.min(newY, desktopRect.height - 80));
            
            // If multiple icons selected, move them all
            if (selectedIcons.has(iconId) && selectedIcons.size > 1) {
              const currentPos = iconPositions[iconId] || { x: 0, y: 0 };
              const deltaX = constrainedX - currentPos.x;
              const deltaY = constrainedY - currentPos.y;
              
              setIconPositions(prev => {
                const updated = { ...prev };
                selectedIcons.forEach(selectedId => {
                  if (selectedId === iconId) {
                    updated[selectedId] = { x: constrainedX, y: constrainedY };
                  } else {
                    const currentPos = prev[selectedId] || { x: 0, y: 0 };
                    let newPosX = currentPos.x + deltaX;
                    let newPosY = currentPos.y + deltaY;
                    
                    if (snapToGrid) {
                      const gridSize = 20;
                      newPosX = Math.round(newPosX / gridSize) * gridSize;
                      newPosY = Math.round(newPosY / gridSize) * gridSize;
                    }
                    
                    updated[selectedId] = {
                      x: Math.max(0, Math.min(newPosX, desktopRect.width - 80)),
                      y: Math.max(0, Math.min(newPosY, desktopRect.height - 80))
                    };
                  }
                });
                return updated;
              });
            } else {
              setIconPositions(prev => ({
                ...prev,
                [iconId]: { x: constrainedX, y: constrainedY }
              }));
            }
          }
        }
      }
    };

    const handleMouseUp = (e) => {
      const wasDragging = iconDragState.current.isDragging;
      // Reset hasMoved after a short delay to allow double-click to check it
      if (wasDragging) {
        setTimeout(() => {
          iconDragState.current.hasMoved = false;
        }, 300);
      } else {
        iconDragState.current.hasMoved = false;
      }
      iconDragState.current.isDragging = false;
      iconDragState.current.iconId = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleIconDoubleClick = (e, action) => {
    // Only trigger if we didn't drag (check with a small delay to ensure drag state is cleared)
    setTimeout(() => {
      if (!iconDragState.current.hasMoved && !iconDragState.current.isDragging) {
        action();
      }
    }, 50);
  };

  // Generate unique name for files/folders
  const generateUniqueName = (type) => {
    const prefix = type === 'file' ? 'file' : 'folder';
    let counter = 1;
    let name = `${prefix}-${counter}`;
    
    while (desktopItems.some(item => item.name === name)) {
      counter++;
      name = `${prefix}-${counter}`;
    }
    
    return name;
  };

  const handleContextMenu = (e, itemId = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ 
      x: e.clientX, 
      y: e.clientY,
      itemId: itemId // If right-clicking on an item, pass its ID
    });
  };

  const handleCreateFile = async () => {
    const desktopRect = document.querySelector('.desktop-background')?.getBoundingClientRect();
    const x = desktopRect ? contextMenu.x - desktopRect.left - 40 : contextMenu.x - 200;
    const y = desktopRect ? contextMenu.y - desktopRect.top - 40 : contextMenu.y - 200;
    
    const fileName = generateUniqueName('file');
    const fileId = `file_${Date.now()}`;
    let finalX = Math.max(0, x);
    let finalY = Math.max(0, y);
    
    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = 20;
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }
    
    const newFile = {
      id: fileId,
      name: fileName,
      type: 'file',
      x: finalX,
      y: finalY
    };
    
    // Create empty file on backend
    const apiUrl = import.meta.env.PROD 
      ? `/api/files/${fileId}`
      : `http://localhost:3001/api/files/${fileId}`;
    
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileName,
          content: ''
        })
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating file on backend:', error);
      }
      // Continue anyway - file will be created when first saved
    }
    
    setDesktopItems(prev => [...prev, newFile]);
    setIconPositions(prev => ({
      ...prev,
      [newFile.id]: { x: newFile.x, y: newFile.y }
    }));
    setContextMenu(null);
  };

  const handleCreateFolder = () => {
    const desktopRect = document.querySelector('.desktop-background')?.getBoundingClientRect();
    const x = desktopRect ? contextMenu.x - desktopRect.left - 40 : contextMenu.x - 200;
    const y = desktopRect ? contextMenu.y - desktopRect.top - 40 : contextMenu.y - 200;
    
    const folderName = generateUniqueName('folder');
    let finalX = Math.max(0, x);
    let finalY = Math.max(0, y);
    
    // Snap to grid if enabled
    if (snapToGrid) {
      const gridSize = 20;
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }
    
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: folderName,
      type: 'folder',
      x: finalX,
      y: finalY
    };
    setDesktopItems(prev => [...prev, newFolder]);
    setIconPositions(prev => ({
      ...prev,
      [newFolder.id]: { x: newFolder.x, y: newFolder.y }
    }));
    setContextMenu(null);
  };

  const handleRename = () => {
    if (!contextMenu?.itemId) return;
    
    const item = desktopItems.find(i => i.id === contextMenu.itemId);
    if (!item) return;
    
    setEditingItem(contextMenu.itemId);
    setEditValue(item.name);
    setContextMenu(null);
  };

  const handleEditSubmit = (itemId) => {
    if (!editValue.trim()) {
      setEditingItem(null);
      return;
    }
    
    setDesktopItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, name: editValue.trim() } : i
    ));
    setEditingItem(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const handleDeleteItem = (itemId) => {
    if (!itemId) return;
    
    const item = desktopItems.find(i => i.id === itemId);
    if (item) {
      setDeleteConfirm({ itemId, itemName: item.name });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    
    const { itemId, allItems } = deleteConfirm;
    const itemsToDelete = allItems || [itemId];
    
    // Remove from desktop items
    const updatedItems = desktopItems.filter(i => !itemsToDelete.includes(i.id));
    setDesktopItems(updatedItems);
    
    // Remove from icon positions
    const updatedPositions = { ...iconPositions };
    itemsToDelete.forEach(id => delete updatedPositions[id]);
    setIconPositions(updatedPositions);
    
    // Clear selection
    setSelectedIcons(new Set());
    setDeleteConfirm(null);
    
    // Save to backend after deletion
    setTimeout(() => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      
      const apiUrl = import.meta.env.PROD 
        ? '/api/desktop'
        : 'http://localhost:3001/api/desktop';
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconPositions: updatedPositions, desktopItems: updatedItems }),
        signal: controller.signal,
        mode: 'cors'
      })
      .then(() => clearTimeout(timeout))
      .catch(() => {
        // Silently fail if backend not available
      });
    }, 100);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Auto-arrange icons function
  const autoArrangeIcons = () => {
    const gridSize = 100;
    const startX = 20;
    const startY = 20;
    const desktopWidth = window.innerWidth;
    const iconsPerRow = Math.floor((desktopWidth - 40) / gridSize);
    
    const allIcons = [
      { id: 'portfolio', ...iconPositions.portfolio },
      ...projects.map((p, idx) => ({ id: p.id, ...iconPositions[p.id] })),
      ...desktopItems.map(item => ({ id: item.id, ...iconPositions[item.id] }))
    ];
    
    const updatedPositions = {};
    allIcons.forEach((icon, idx) => {
      const row = Math.floor(idx / iconsPerRow);
      const col = idx % iconsPerRow;
      updatedPositions[icon.id] = {
        x: startX + (col * gridSize),
        y: startY + (row * gridSize)
      };
    });
    
    setIconPositions(updatedPositions);
  };

  return (
    <div className="windows-xp-desktop">
      {/* Desktop Background */}
      <div 
        className={`desktop-background theme-${theme}`}
        onMouseDown={(e) => {
          // Only start selection if clicking on desktop (not on an icon)
          if (e.target.classList.contains('desktop-background') || e.target.closest('.desktop-icon') === null) {
            const desktopRect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - desktopRect.left;
            const startY = e.clientY - desktopRect.top;
            
            selectionState.current = {
              isSelecting: true,
              startX,
              startY
            };
            
            setSelectionBox({
              x: startX,
              y: startY,
              width: 0,
              height: 0
            });
            
            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey) {
              setSelectedIcons(new Set());
            }
          }
        }}
        onMouseMove={(e) => {
          if (selectionState.current.isSelecting) {
            const desktopRect = e.currentTarget.getBoundingClientRect();
            const currentX = e.clientX - desktopRect.left;
            const currentY = e.clientY - desktopRect.top;
            
            const startX = selectionState.current.startX;
            const startY = selectionState.current.startY;
            
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            
            setSelectionBox({ x: left, y: top, width, height });
            
            // Find icons within selection box
            const selected = new Set(selectedIcons);
            const allIcons = document.querySelectorAll('.desktop-icon');
            
            allIcons.forEach(icon => {
              const iconRect = icon.getBoundingClientRect();
              const iconLeft = iconRect.left - desktopRect.left;
              const iconTop = iconRect.top - desktopRect.top;
              const iconRight = iconLeft + iconRect.width;
              const iconBottom = iconTop + iconRect.height;
              
              const boxRight = left + width;
              const boxBottom = top + height;
              
              // Check if icon overlaps with selection box
              if (iconLeft < boxRight && iconRight > left && iconTop < boxBottom && iconBottom > top) {
                const iconId = icon.getAttribute('data-icon-id');
                if (iconId) {
                  selected.add(iconId);
                }
              } else {
                const iconId = icon.getAttribute('data-icon-id');
                if (iconId && !e.ctrlKey && !e.metaKey) {
                  selected.delete(iconId);
                }
              }
            });
            
            setSelectedIcons(selected);
          }
        }}
        onMouseUp={(e) => {
          if (selectionState.current.isSelecting) {
            selectionState.current.isSelecting = false;
            setSelectionBox(null);
          }
        }}
        onClick={(e) => {
          setStartMenuOpen(false);
          setContextMenu(null);
          if (editingItem) {
            handleEditCancel();
          }
          // Clear selection on click (unless Ctrl/Cmd is held or we just finished selecting)
          if (!e.ctrlKey && !e.metaKey && !selectionState.current.isSelecting) {
            setSelectedIcons(new Set());
          }
        }}
        onContextMenu={(e) => handleContextMenu(e)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Clear any drag data if dropped on desktop
          e.dataTransfer.clearData();
        }}
      >
        <div className="birthday-text">HAPPY BIRTHDAY YARA</div>
        {/* Desktop Icons */}
        <div className="desktop-icons">
          {/* Selection Box */}
          {selectionBox && (
            <div
              className="selection-box"
              style={{
                position: 'absolute',
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height
              }}
            />
          )}

          {/* Portfolio Book Icon */}
          <div 
            className={`desktop-icon ${selectedIcons.has('portfolio') ? 'selected' : ''}`}
            data-icon-id="portfolio"
            style={{
              position: 'absolute',
              left: iconPositions.portfolio?.x || 20,
              top: iconPositions.portfolio?.y || 20
            }}
            onMouseDown={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                setSelectedIcons(new Set(['portfolio']));
              } else {
                setSelectedIcons(prev => {
                  const next = new Set(prev);
                  if (next.has('portfolio')) {
                    next.delete('portfolio');
                  } else {
                    next.add('portfolio');
                  }
                  return next;
                });
              }
              handleIconMouseDown(e, 'portfolio');
            }}
            onDoubleClick={(e) => handleIconDoubleClick(e, () => openWindow('portfolio', 'My Portfolio - CV', null))}
          >
            <div className="icon-image book-icon">📖</div>
            <div className="icon-label">Portfolio</div>
          </div>

          {/* Project Folders */}
          {projects.map(project => (
            <div
              key={project.id}
              className={`desktop-icon ${selectedIcons.has(project.id) ? 'selected' : ''}`}
              data-icon-id={project.id}
              style={{
                position: 'absolute',
                left: iconPositions[project.id]?.x || 20,
                top: iconPositions[project.id]?.y || (100 + (projects.indexOf(project) * 80))
              }}
              onMouseDown={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  setSelectedIcons(new Set([project.id]));
                } else {
                  setSelectedIcons(prev => {
                    const next = new Set(prev);
                    if (next.has(project.id)) {
                      next.delete(project.id);
                    } else {
                      next.add(project.id);
                    }
                    return next;
                  });
                }
                handleIconMouseDown(e, project.id);
              }}
              onDoubleClick={(e) => handleIconDoubleClick(e, () => {
                if (project.type === 'game' || project.type === 'browser') {
                  openWindow(project.id, project.title, project.component);
                } else {
                  openWindow(project.id, project.title, <ProjectFolder project={project} />);
                }
              })}
            >
              <div className="icon-image folder-icon">
                {project.type === 'browser' ? '🌐' : '📁'}
              </div>
              <div className="icon-label">{project.title}</div>
            </div>
          ))}

          {/* Created Files and Folders */}
          {desktopItems.map(item => (
            <div
              key={item.id}
              className={`desktop-icon ${selectedIcons.has(item.id) ? 'selected' : ''}`}
              data-icon-id={item.id}
              draggable={editingItem !== item.id ? "true" : "false"}
              onMouseDown={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  setSelectedIcons(new Set([item.id]));
                } else {
                  setSelectedIcons(prev => {
                    const next = new Set(prev);
                    if (next.has(item.id)) {
                      next.delete(item.id);
                    } else {
                      next.add(item.id);
                    }
                    return next;
                  });
                }
              }}
              style={{
                position: 'absolute',
                left: iconPositions[item.id]?.x || item.x || 20,
                top: iconPositions[item.id]?.y || item.y || 20
              }}
              onDragStart={(e) => {
                if (editingItem === item.id) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'move';
                e.stopPropagation();
              }}
              onDragEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                if (editingItem === item.id) return;
                handleIconDoubleClick(e, () => {
                  if (item.id === 'gift-file') {
                    // Trigger confetti for gift file
                    setShowConfetti(true);
                  } else if (item.type === 'file') {
                    // Open file in editor
                    openWindow(
                      `file_${item.id}`, 
                      item.name, 
                      <FileEditor 
                        fileId={item.id} 
                        fileName={item.name}
                        onClose={() => closeWindow(`file_${item.id}`)}
                        onSave={() => {
                          // File saved successfully
                        }}
                      />
                    );
                  } else {
                    // Folder double-click (could open folder view in future)
                    // For now, do nothing
                  }
                });
              }}
              onContextMenu={(e) => {
                if (editingItem === item.id) return;
                handleContextMenu(e, item.id);
              }}
            >
              <div className="icon-image">{item.id === 'gift-file' ? '🎁' : (item.type === 'file' ? '📄' : '📁')}</div>
              {editingItem === item.id ? (
                <input
                  type="text"
                  className="icon-label-edit"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEditSubmit(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEditSubmit(item.id);
                    } else if (e.key === 'Escape') {
                      handleEditCancel();
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div 
                  className="icon-label"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingItem(item.id);
                    setEditValue(item.name);
                  }}
                >
                  {item.name}
                </div>
              )}
            </div>
          ))}

          {/* Recycle Bin */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20
            }}
          >
            <RecycleBin
              onDrop={handleDeleteItem}
              onDoubleClick={() => {
                // Show deleted items (could be expanded later)
                // No alert - just silently show empty state
              }}
            />
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onCreateFile={contextMenu.itemId ? null : handleCreateFile}
            onCreateFolder={contextMenu.itemId ? null : handleCreateFolder}
            onRename={contextMenu.itemId ? handleRename : null}
            isItemMenu={!!contextMenu.itemId}
          />
        )}

        {/* Open Windows */}
        {openWindows.map(window => (
          <div
            key={window.id}
            className={`window ${window.isMaximized ? 'maximized' : ''}`}
            style={{ 
              zIndex: window.zIndex + 1000,
              left: window.isMaximized ? 0 : (window.x !== undefined ? window.x : (window.innerWidth <= 768 ? 0 : '50%')),
              top: window.isMaximized ? 0 : (window.y !== undefined ? window.y : (window.innerHeight <= 768 ? 0 : '50%')),
              width: window.isMaximized ? '100%' : (window.width || 1000) + 'px',
              height: window.isMaximized ? 'calc(100% - 40px)' : (window.height || 700) + 'px',
              transform: window.isMaximized ? 'none' : (window.x !== undefined || window.innerWidth <= 768 ? 'none' : 'translate(-50%, -50%)')
            }}
            onMouseDown={(e) => handleMouseDown(e, window.id)}
          >
            <div className="window-titlebar">
              <span className="window-title">{window.title}</span>
              <div className="window-buttons">
                <button 
                  className="window-maximize" 
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(window.id); }}
                  title={window.isMaximized ? "Restore" : "Maximize"}
                >
                  {window.isMaximized ? '❐' : '□'}
                </button>
                <button 
                  className="window-close" 
                  onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="window-content" onClick={(e) => e.stopPropagation()}>
              {window.content}
            </div>
            {!window.isMaximized && (
              <>
                <div 
                  className="resize-handle resize-top"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'top')}
                />
                <div 
                  className="resize-handle resize-right"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'right')}
                />
                <div 
                  className="resize-handle resize-bottom"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'bottom')}
                />
                <div 
                  className="resize-handle resize-left"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'left')}
                />
                <div 
                  className="resize-handle resize-top-left"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'top-left')}
                />
                <div 
                  className="resize-handle resize-top-right"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'top-right')}
                />
                <div 
                  className="resize-handle resize-bottom-left"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'bottom-left')}
                />
                <div 
                  className="resize-handle resize-bottom-right"
                  onMouseDown={(e) => handleResizeMouseDown(e, window.id, 'bottom-right')}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <div className="start-menu" onClick={(e) => e.stopPropagation()}>
          <div className="start-menu-header">
            <div className="start-menu-user">Guest</div>
          </div>
          <div className="start-menu-items">
            <div 
              className="start-menu-item"
              onClick={() => openWindow('portfolio', 'My Portfolio - CV', null)}
            >
              <span className="start-menu-icon">📖</span>
              <span className="start-menu-text">My Portfolio</span>
            </div>
            {projects.map(project => (
              <div
                key={project.id}
                className="start-menu-item"
                onClick={() => {
                  if (project.type === 'game' || project.type === 'browser') {
                    openWindow(project.id, project.title, project.component);
                  } else {
                    openWindow(project.id, project.title, <ProjectFolder project={project} />);
                  }
                }}
              >
                <span className="start-menu-icon">
                  {project.type === 'game' ? '🎮' : project.type === 'browser' ? '🌐' : '📁'}
                </span>
                <span className="start-menu-text">{project.title}</span>
              </div>
            ))}
          </div>
          <div className="start-menu-footer">
            <button className="start-menu-shutdown" onClick={handleShutdown}>
              <span className="shutdown-icon">⏻</span>
              <span>Turn Off Computer</span>
            </button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="taskbar">
        <button 
          className={`start-button ${startMenuOpen ? 'active' : ''}`}
          onClick={() => setStartMenuOpen(!startMenuOpen)}
        >
          Start
        </button>
        <div className="taskbar-tasks">
          {openWindows.map(window => (
            <button
              key={window.id}
              className="taskbar-task"
              onClick={() => bringToFront(window.id)}
            >
              {window.title}
            </button>
          ))}
        </div>
        <div className="system-tray">
          <div className="clock">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Fullscreen Book Overlay */}
      {isBookOpen && (
        <PortfolioBook onClose={() => setIsBookOpen(false)} />
      )}

      {/* Confetti */}
      {showConfetti && (
        <Confetti onComplete={() => setShowConfetti(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          itemName={deleteConfirm.itemName}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Shutdown Confirmation Modal */}
      {shutdownConfirm && (
        <DeleteConfirmModal
          itemName=""
          title="Shut Down"
          message="Are you sure you want to shut down?"
          warning=""
          onConfirm={confirmShutdown}
          onCancel={cancelShutdown}
        />
      )}

      {/* Notification Modal */}
      {notification && (
        <NotificationModal
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default WindowsXPDesktop;

