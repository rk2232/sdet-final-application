# Vercel Deployment Guide

## Current Issue

Your frontend is deployed on Vercel, but the backend API isn't working because:
1. The Express server needs to be configured as Vercel serverless functions
2. Environment variables (like TMDB_API_KEY) need to be set in Vercel

## Quick Fix Steps

### 1. Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
TMDB_API_KEY=your-actual-tmdb-api-key-here
JWT_SECRET=your-random-secret-key-here
SESSION_SECRET=your-random-session-secret-here
NODE_ENV=production
```

**To get TMDB API Key:**
- Go to https://www.themoviedb.org/
- Create account → Settings → API
- Request an API key (free)

### 2. Redeploy on Vercel

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### 3. Verify Deployment

After redeployment, check:
- `https://sdet-final-application.vercel.app/api/health` - Should return `{"status":"ok",...}`
- `https://sdet-final-application.vercel.app/api/movies/popular` - Should return movies (if API key is set)

## File Structure for Vercel

The project now includes:
- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless function entry point
- `server.js` - Modified to work with Vercel

## Troubleshooting

### Movies Still Not Loading

1. **Check API Key**: Verify `TMDB_API_KEY` is set in Vercel environment variables
2. **Check Deployment Logs**: Go to Vercel dashboard → Deployments → Click on deployment → View logs
3. **Test API Endpoint**: Visit `https://sdet-final-application.vercel.app/api/movies/popular` directly
4. **Check Browser Console**: Open browser DevTools (F12) → Console tab for errors

### Common Errors

**"TMDB API key is not configured"**
- Solution: Add `TMDB_API_KEY` to Vercel environment variables and redeploy

**"Invalid TMDB API key"**
- Solution: Check that your API key is correct in Vercel environment variables

**"Cannot GET /api/movies/popular"**
- Solution: The serverless function may not be deployed. Check `vercel.json` and redeploy

### Database Note

⚠️ **Important**: SQLite database files don't persist on Vercel serverless functions. For production, you'll need to:
- Use a cloud database (PostgreSQL, MongoDB, etc.)
- Or use Vercel's serverless database
- Or host the backend separately (Railway, Render, Heroku, etc.)

For now, the database will reset on each deployment. Consider migrating to a cloud database for production use.

## Alternative: Separate Backend Hosting

If you prefer to keep the backend separate:

1. Deploy backend to Railway, Render, or Heroku
2. Update `public/app.js` to point to your backend URL:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.com/api';
   ```

## Next Steps

1. ✅ Add environment variables in Vercel
2. ✅ Redeploy the application
3. ✅ Test the API endpoints
4. ⚠️ Consider migrating to a cloud database for production

