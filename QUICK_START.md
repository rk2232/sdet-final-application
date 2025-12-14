# Quick Start Guide

## ✅ Setup Complete!

All setup steps have been completed:

1. ✅ **Dependencies Installed** - All npm packages are installed
2. ✅ **Environment File Created** - `.env` file created with default values
3. ✅ **Database Initialized** - SQLite database created with all tables

## 🚀 Starting the Application

### Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## ⚙️ Configuration Required

### 1. TMDB API Key (Required for Movie Features)
1. Go to https://www.themoviedb.org/
2. Create a free account
3. Go to Settings > API
4. Request an API key (free)
5. Open `.env` file and replace `your-tmdb-api-key-here` with your actual API key

### 2. Google OAuth (Optional - for Google Sign-in)
If you want to enable Google sign-in:

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure consent screen
6. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env` file

### 3. Security Keys (Important for Production)
Before deploying to production, change these in `.env`:
- `JWT_SECRET` - Use a strong random string
- `SESSION_SECRET` - Use a strong random string

## 🎬 Using the Application

### Register/Login
- **Username/Password**: Use the login form with username and password
- **Google Sign-in**: Click "Sign in with Google" button (if configured)

### Features Available
- ✅ Browse and search movies
- ✅ View movie details
- ✅ Add movies to watch history
- ✅ Rate movies
- ✅ Set preferences (genres, actors, min rating)
- ✅ Get personalized recommendations
- ✅ View statistics and charts

## 📝 Notes

- The application works without TMDB API key, but movie features won't work
- Google OAuth is optional - username/password login works without it
- Database is stored in `database.sqlite` file
- All user data is stored locally in SQLite

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, change `PORT` in `.env` file

### Database Issues
If you need to reset the database:
```bash
# Delete the database file
Remove-Item database.sqlite

# Reinitialize
npm run init-db
```

### Module Errors
If you see module errors, reinstall:
```bash
npm install
```

## 🎉 You're Ready!

The application is set up and ready to use. Just add your TMDB API key to start browsing movies!

