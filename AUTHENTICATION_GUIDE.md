# Authentication Guide

## Overview

The Movie Recommendation System now supports two authentication methods:

1. **Username/Password Authentication** - Traditional login with username and password
2. **Google OAuth Authentication** - Sign in with your Google account

## Username/Password Login

### Registration
1. Click "Login" in the navigation
2. Switch to the "Register" tab
3. Fill in:
   - **Username** (must be unique, minimum 3 characters)
   - **Email** (must be unique and valid)
   - **Password** (minimum 6 characters)
4. Click "Register"

### Login
1. Click "Login" in the navigation
2. Enter your **username** and **password**
3. Click "Login"

**Note**: The login now uses **username** instead of email for authentication.

## Google OAuth Login

### Setup (For Developers)

1. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure the OAuth consent screen if prompted
   - Set application type to "Web application"
   - Add authorized redirect URI:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
   - Copy the Client ID and Client Secret

2. **Add to Environment Variables**:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   FRONTEND_URL=http://localhost:3000
   SESSION_SECRET=your-session-secret
   ```

### Using Google Sign-In

1. Click "Login" or "Register" in the navigation
2. Click the "Sign in with Google" or "Sign up with Google" button
3. You'll be redirected to Google's login page
4. Select your Google account and authorize the application
5. You'll be automatically redirected back and logged in

### How It Works

- **First-time users**: A new account is automatically created with your Google account information
- **Existing users**: If you've previously registered with the same email, your accounts will be linked
- **Username generation**: Your username is automatically generated from your Google display name or email

## Database Migration

If you have an existing database, run the migration script to add Google OAuth support:

```bash
npm run migrate-db
```

This will:
- Add `google_id` column to the users table
- Make the password column nullable (for OAuth users who don't have passwords)

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs (10 rounds)
- **JWT Tokens**: Secure token-based authentication
- **OAuth Security**: Google OAuth follows OAuth 2.0 best practices
- **Session Management**: Secure session handling for OAuth flow

## Troubleshooting

### Google OAuth Not Working

1. **Check Environment Variables**: Ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are set correctly
2. **Verify Redirect URI**: The redirect URI in Google Console must match exactly (including http/https and port)
3. **Check API Status**: Ensure Google+ API is enabled in your Google Cloud project
4. **Browser Console**: Check browser console for any errors

### Username Already Taken

- Try a different username
- If using Google OAuth, the system will automatically generate a unique username

### Cannot Login with Username

- Ensure you're using your **username**, not email
- Check that your account exists (try registering first)
- Verify your password is correct

## API Endpoints

### Username/Password Login
```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}
```

### Google OAuth
```
GET /api/auth/google
```
Redirects to Google OAuth flow.

```
GET /api/auth/google/callback
```
OAuth callback endpoint (handled automatically).

## Notes

- Google OAuth is optional - the application works without it
- You can link your Google account to an existing username/password account
- Passwords are never stored in plain text
- JWT tokens expire after 7 days

