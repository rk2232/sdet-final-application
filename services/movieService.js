const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

class MovieService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchMovies(query, page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  async getMovieDetails(movieId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  async getPopularMovies(page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: this.apiKey,
          page,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  }

  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          with_genres: genreId,
          page,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  }

  async getGenres() {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
        params: {
          api_key: this.apiKey,
        },
      });
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  getImageUrl(path) {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${path}`;
  }
}

// Create movie service instance
const movieService = new MovieService(process.env.TMDB_API_KEY);

// Log if API key is missing (helpful for debugging)
if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === 'your-tmdb-api-key-here') {
  console.warn('⚠️  TMDB_API_KEY is not configured. Movie features will not work.');
  console.warn('   Please add TMDB_API_KEY to your Vercel environment variables.');
}

module.exports = movieService;

