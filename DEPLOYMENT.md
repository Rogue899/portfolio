# Deployment Guide

## Deploying to Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Steps

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com/new
   - Import your repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

3. **Or deploy via Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

### Configuration

The `vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA routing rewrites

### Environment Variables

No environment variables needed for basic deployment.

### Backend Server (Optional)

The backend server (`server.js`) is optional. The app works without it - it will just use default icon positions. If you want to deploy the backend:

1. Deploy backend separately (e.g., Railway, Render, or Vercel Serverless Functions)
2. Update the API URL in `WindowsXPDesktop.jsx` to point to your deployed backend

### Notes

- LinkedIn and GitHub iframe blocking is expected (CSP restrictions)
- Backend connection errors are handled gracefully - the app works without the backend
- All features work in production except backend persistence (which is optional)

