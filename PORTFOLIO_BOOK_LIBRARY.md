# Portfolio Book Library

## Library: **react-pageflip**

**Version**: `^2.0.3`  
**Official Website**: https://nodlik.github.io/react-pageflip/  
**NPM Package**: https://www.npmjs.com/package/react-pageflip  
**GitHub**: https://github.com/nodlik/react-pageflip

## What It Does

The `react-pageflip` library is used to create the interactive portfolio book experience. It provides:

- ✅ Realistic page-flipping animations
- ✅ Two-page spread view (shows left and right pages simultaneously)
- ✅ Smooth page transitions
- ✅ Touch and mobile device support
- ✅ Customizable page sizes and styling

## Installation

Already installed in this project. If you need to reinstall:

```bash
npm install react-pageflip
```

## Usage in This Project

The library is used in `src/components/PortfolioBook.jsx`:

```jsx
import HTMLFlipBook from 'react-pageflip';

<HTMLFlipBook
  width={window.innerWidth * 0.9}
  height={window.innerHeight * 0.85}
  ref={flipBook}
  onFlip={(e) => setCurrentPage(e.data)}
>
  {/* Your pages here */}
</HTMLFlipBook>
```

## Features Used

- Fullscreen book display (no window frame)
- Page navigation controls
- Responsive sizing based on viewport
- Custom page styling with book-like appearance

## Documentation

For more information, visit:
- **Official Website**: https://nodlik.github.io/react-pageflip/
- **NPM Package**: https://www.npmjs.com/package/react-pageflip

## About the Library

`react-pageflip` is a React.js wrapper for the StPageFlip library, providing:
- Simple React API
- Works with HTML blocks and images
- Mobile device support
- Landscape and portrait modes
- Soft and hard page types
- No dependencies

