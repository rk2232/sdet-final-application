# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create Environment File
Create a `.env` file in the root directory with the following content:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production-use-a-random-string
TMDB_API_KEY=your-tmdb-api-key-here
NODE_ENV=development

# Google OAuth (Optional - for Google Sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-session-secret
```

### Getting a TMDB API Key:
1. Go to https://www.themoviedb.org/
2. Create a free account
3. Go to Settings > API
4. Request an API key (free)
5. Copy the API key to your `.env` file

### Setting up Google OAuth (Optional):
1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure consent screen if prompted
6. Set application type to "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
8. Copy Client ID and Client Secret to your `.env` file
9. For production, update `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` with your production URLs

## Step 3: Initialize Database
```bash
npm run init-db
```

This will create the SQLite database with all necessary tables.

## Step 4: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Testing the Application

1. **Register a new account**:
   - Click "Login" in the navigation
   - Switch to "Register" tab
   - Fill in username, email, and password
   - Click "Register"

2. **Browse Movies**:
   - Use the search bar to find movies
   - Click on any movie to see details
   - Mark movies as watched and rate them

3. **Set Preferences**:
   - Go to "Profile"
   - Set your favorite genres (e.g., "Action, Drama, Comedy")
   - Set minimum rating preference
   - Save preferences

4. **Get Recommendations**:
   - Go to "Recommendations" page
   - See personalized movie suggestions based on your preferences

5. **View Statistics**:
   - Go to "Profile"
   - See your watch history and statistics
   - View interactive charts

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, change the PORT in your `.env` file.

### Database Errors
If you encounter database errors, delete `database.sqlite` and run `npm run init-db` again.

### TMDB API Errors
Make sure your TMDB API key is correct and active. Check the API key in your TMDB account settings.

### Module Not Found
Run `npm install` again to ensure all dependencies are installed.

