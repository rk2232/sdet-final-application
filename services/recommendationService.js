const WatchHistory = require('../models/WatchHistory');
const UserPreferences = require('../models/UserPreferences');
const movieService = require('./movieService');

class RecommendationService {
  async getRecommendations(userId) {
    try {
      // Get user preferences
      const preferences = await UserPreferences.findByUserId(userId);
      
      // Get watch history
      const watchHistory = await WatchHistory.findByUserId(userId);
      const watchedMovieIds = watchHistory.map(item => item.movieId);
      
      // Get user's rated movies to understand preferences
      const ratedMovies = watchHistory.filter(item => item.rating !== null);
      
      // Calculate average rating preference
      const avgRating = ratedMovies.length > 0
        ? ratedMovies.reduce((sum, item) => sum + item.rating, 0) / ratedMovies.length
        : 7.0;
      
      // Get favorite genres from preferences
      const favoriteGenres = preferences?.favorite_genres
        ? preferences.favorite_genres.split(',').map(g => g.trim())
        : [];
      
      // Strategy 1: Recommend based on favorite genres
      let recommendations = [];
      
      if (favoriteGenres.length > 0) {
        // Get genre IDs from TMDB
        const genres = await movieService.getGenres();
        const genreMap = {};
        genres.forEach(genre => {
          genreMap[genre.name.toLowerCase()] = genre.id;
        });
        
        // Get movies for each favorite genre
        for (const genreName of favoriteGenres.slice(0, 3)) {
          const genreId = genreMap[genreName.toLowerCase()];
          if (genreId) {
            try {
              const genreMovies = await movieService.getMoviesByGenre(genreId, 1);
              const filtered = genreMovies.results
                .filter(movie => !watchedMovieIds.includes(movie.id))
                .filter(movie => movie.vote_average >= (preferences?.min_rating || 6.0))
                .slice(0, 5);
              recommendations.push(...filtered);
            } catch (error) {
              console.error(`Error fetching movies for genre ${genreName}:`, error);
            }
          }
        }
      }
      
      // Strategy 2: If no genre preferences, use popular movies
      if (recommendations.length === 0) {
        const popularMovies = await movieService.getPopularMovies(1);
        recommendations = popularMovies.results
          .filter(movie => !watchedMovieIds.includes(movie.id))
          .filter(movie => movie.vote_average >= (preferences?.min_rating || 6.0))
          .slice(0, 20);
      }
      
      // Remove duplicates
      const uniqueRecommendations = [];
      const seenIds = new Set();
      for (const movie of recommendations) {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          uniqueRecommendations.push(movie);
        }
      }
      
      // Sort by vote average and limit to 20
      return uniqueRecommendations
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 20)
        .map(movie => ({
          ...movie,
          poster_url: movieService.getImageUrl(movie.poster_path),
        }));
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();

