# Windows XP Portfolio

A nostalgic portfolio website that mimics the Windows XP interface with an interactive flipbook CV and project folders.

## Features

- 🖥️ **Windows XP Desktop**: Authentic-looking desktop with taskbar and icons
- 📖 **Interactive CV Book**: Flipbook-style resume using react-pageflip
- 📁 **Project Folders**: Click folders to open project windows with iframe support
- 🖱️ **Draggable Windows & Icons**: Drag windows and desktop icons around
- ⏰ **Live Clock**: Real-time clock in the system tray
- 🎮 **Retro Games**: Built-in Tic Tac Toe and Pong games
- 📄 **File Management**: Right-click to create files/folders, double-click to rename in-place
- 🗑️ **Recycle Bin**: Drag files/folders to delete with confirmation modal
- 🗄️ **Backend API**: Express server to persist desktop layout and files

## Getting Started

### Installation

```bash
npm install
```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The backend runs on `http://localhost:3001` and the frontend on `http://localhost:5173` (or the port Vite assigns).

### Build

```bash
npm run build
```

## Customization

### Adding Your CV Content

Edit `src/components/PortfolioBook.jsx` and modify the `cvPages` array:

```jsx
const cvPages = [
  {
    title: "About Me",
    content: (
      <div className="cv-page">
        <h1>Your Name</h1>
        <h2>Your Title</h2>
        {/* Your content here */}
      </div>
    )
  },
  // Add more pages...
];
```

### Adding Projects

Edit `src/components/WindowsXPDesktop.jsx` and modify the `projects` array:

```jsx
const projects = [
  { 
    id: 'project1', 
    title: 'My Project', 
    description: 'Project description',
    url: 'https://your-project-url.com' // Optional: for iframe
  },
  // Add more projects...
];
```

### Customizing Project Iframes

Edit `src/components/ProjectFolder.jsx` to update the iframe source:

```jsx
<iframe
  src={project.url || "https://your-project-url.com"}
  title={project.title}
  className="project-iframe"
  frameBorder="0"
/>
```

### Styling

- Windows XP styles: `src/components/WindowsXPDesktop.css`
- Book styles: `src/components/PortfolioBook.css`
- Project folder styles: `src/components/ProjectFolder.css`

## Projects Showcased

- **Rick & Morty Explorer**: Character explorer application
- **Frontend Project**: Frontend showcase
- **Tic Tac Toe**: Classic game built with React
- **Pong**: Classic arcade game with canvas

## Technologies

- React 19
- Vite
- **react-pageflip** (v2.0.3) - For the portfolio book flip effect
- Express.js (Backend)
- Node.js

### Portfolio Book Library

The portfolio uses **react-pageflip** library for creating the interactive book experience. This library provides:
- Realistic page-flipping animations
- Two-page spread view (left and right pages)
- Touch/mobile support
- Smooth transitions

See `LIBRARY_INFO.md` for more details.

## Usage

- **Right-click** on desktop to create new files/folders
- **Double-click** icons to open windows
- **Drag** icons and windows to reposition
- **Maximize** windows using the □ button
- **Start Menu** - Click Start button to see all projects and games
- **Shutdown** - Click "Turn Off Computer" in Start menu

## License

MIT
