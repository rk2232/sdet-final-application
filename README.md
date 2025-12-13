# Movie Recommendation System

A full-stack web application that provides personalized movie recommendations based on user preferences and watch history. Built with Node.js, Express, SQLite, and modern frontend technologies.

## Features

### Core Features
- ✅ **User Registration and Authentication**: Secure user accounts with JWT tokens and bcrypt password hashing
- ✅ **CRUD Operations**: Complete Create, Read, Update, Delete functionality for user data, preferences, and watch history
- ✅ **Movie Database Integration**: Integration with The Movie Database (TMDB) API for movie data
- ✅ **Personalized Recommendations**: AI-powered recommendations based on user preferences and viewing history
- ✅ **Responsive Design**: Mobile-friendly interface that works across all devices
- ✅ **Data Visualization**: Interactive charts using Chart.js to display user statistics

### Additional Features
- ✅ **API Integration**: TMDB API for comprehensive movie database
- ✅ **Advanced Data Visualization**: Chart.js for user statistics and analytics
- ✅ **Role-Based Access Control**: Admin and user roles with different permissions

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (easily migratable to PostgreSQL/MySQL)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for API calls

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **JavaScript (ES6+)** - Client-side logic
- **Chart.js** - Data visualization

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- TMDB API Key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sdet-final-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-secret-key-change-this-in-production
   TMDB_API_KEY=your-tmdb-api-key-here
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "user" (optional)
}
```

#### Login
```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}
```

#### Google OAuth Login
```
GET /api/auth/google
```
Redirects to Google OAuth. After authentication, redirects back with JWT token.

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Movie Endpoints

#### Search Movies
```
GET /api/movies/search?query=<search-term>&page=<page-number>
```

#### Get Popular Movies
```
GET /api/movies/popular?page=<page-number>
```

#### Get Movie Details
```
GET /api/movies/:id
```

#### Get Genres
```
GET /api/movies/genres/list
```

### User Endpoints (Requires Authentication)

#### Get User Profile
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
```

#### Update User Profile
```
PUT /api/users/profile
Headers: Authorization: Bearer <token>
Body: {
  "username": "string" (optional),
  "email": "string" (optional),
  "password": "string" (optional)
}
```

#### Get User Preferences
```
GET /api/users/preferences
Headers: Authorization: Bearer <token>
```

#### Update User Preferences
```
PUT /api/users/preferences
Headers: Authorization: Bearer <token>
Body: {
  "favoriteGenres": "string",
  "favoriteActors": "string",
  "minRating": number,
  "preferredLanguage": "string"
}
```

#### Get Watch History
```
GET /api/users/watch-history
Headers: Authorization: Bearer <token>
```

#### Add to Watch History
```
POST /api/users/watch-history
Headers: Authorization: Bearer <token>
Body: {
  "movieId": number,
  "movieTitle": "string",
  "rating": number (optional, 1-10)
}
```

#### Update Rating
```
PUT /api/users/watch-history/:id
Headers: Authorization: Bearer <token>
Body: {
  "rating": number (1-10)
}
```

#### Delete Watch History Item
```
DELETE /api/users/watch-history/:id
Headers: Authorization: Bearer <token>
```

#### Get User Statistics
```
GET /api/users/stats
Headers: Authorization: Bearer <token>
```

### Recommendation Endpoints (Requires Authentication)

#### Get Recommendations
```
GET /api/recommendations
Headers: Authorization: Bearer <token>
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `role` - User role (user/admin)
- `created_at` - Timestamp

### User Preferences Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `favorite_genres` - Comma-separated genres
- `favorite_actors` - Comma-separated actors
- `min_rating` - Minimum rating preference
- `preferred_language` - Language preference

### Watch History Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `movie_id` - TMDB movie ID
- `movie_title` - Movie title
- `rating` - User rating (1-10)
- `watched_at` - Timestamp

### Watchlist Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `movie_id` - TMDB movie ID
- `movie_title` - Movie title
- `added_at` - Timestamp

## Deployment

### AWS Deployment

1. **Using AWS Elastic Beanstalk**
   - Create an Elastic Beanstalk application
   - Upload the application using the EB CLI or console
   - Configure environment variables in the EB console
   - Use RDS for PostgreSQL database (recommended for production)

2. **Using AWS EC2**
   - Launch an EC2 instance
   - Install Node.js and npm
   - Clone the repository
   - Set up PM2 for process management
   - Configure environment variables
   - Set up Nginx as reverse proxy

### Google Cloud Platform (GCP) Deployment

1. **Using App Engine**
   - Create `app.yaml` configuration file
   - Deploy using `gcloud app deploy`
   - Configure environment variables in App Engine settings

2. **Using Cloud Run**
   - Build Docker image
   - Push to Container Registry
   - Deploy to Cloud Run
   - Configure environment variables

### Azure Deployment

1. **Using App Service**
   - Create a new App Service
   - Configure deployment from Git or ZIP
   - Set application settings (environment variables)
   - Configure database connection

2. **Using Azure Container Instances**
   - Build Docker image
   - Push to Azure Container Registry
   - Deploy container instance

### Database Migration for Production

For production, migrate from SQLite to PostgreSQL or MySQL:

1. **Install PostgreSQL/MySQL driver**
   ```bash
   npm install pg  # for PostgreSQL
   # or
   npm install mysql2  # for MySQL
   ```

2. **Update `config/database.js`** to use the new database

3. **Run migrations** to create tables in the new database

## Security Features

- Password hashing using bcryptjs
- JWT token-based authentication
- Input validation using express-validator
- SQL injection protection (parameterized queries)
- CORS configuration
- Environment variables for sensitive data

## Project Structure

```
sdet-final-application/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── WatchHistory.js      # Watch history model
│   └── UserPreferences.js   # User preferences model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── movies.js            # Movie routes
│   ├── users.js             # User routes
│   └── recommendations.js   # Recommendation routes
├── services/
│   ├── movieService.js      # TMDB API service
│   └── recommendationService.js  # Recommendation algorithm
├── scripts/
│   └── init-db.js           # Database initialization
├── public/
│   ├── index.html           # Frontend HTML
│   ├── styles.css           # Frontend styles
│   └── app.js               # Frontend JavaScript
├── server.js                # Express server
├── package.json             # Dependencies
└── README.md                # Documentation
```

## Usage

1. **Register a new account** or **login** with existing credentials
2. **Browse movies** using the search functionality or view popular movies
3. **Set your preferences** in the profile section (favorite genres, actors, minimum rating)
4. **Add movies to watch history** by clicking on a movie and marking it as watched
5. **Rate movies** you've watched (1-10 scale)
6. **View personalized recommendations** based on your preferences and history
7. **Check your statistics** in the profile section with interactive charts

## Recommendation Algorithm

The recommendation system uses a multi-strategy approach:

1. **Genre-based recommendations**: If user has favorite genres, recommends movies from those genres
2. **Rating-based filtering**: Filters movies based on user's minimum rating preference
3. **Watch history exclusion**: Excludes movies already watched
4. **Popularity fallback**: If no genre preferences, suggests popular movies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

## Future Enhancements

- [ ] Email notifications for new recommendations
- [ ] Social features (share recommendations, follow friends)
- [ ] Advanced filtering options
- [ ] Movie reviews and comments
- [ ] Watchlist functionality
- [ ] Machine learning-based recommendations
- [ ] Mobile app version

