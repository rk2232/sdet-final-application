const express = require('express');
const movieService = require('../services/movieService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search movies
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = await movieService.searchMovies(query, page);
    const movies = results.results.map(movie => ({
      ...movie,
      poster_url: movieService.getImageUrl(movie.poster_path),
    }));

    res.json({
      movies,
      page: results.page,
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching movies' });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const results = await movieService.getPopularMovies(page);
    const movies = results.results.map(movie => ({
      ...movie,
      poster_url: movieService.getImageUrl(movie.poster_path),
    }));

    res.json({
      movies,
      page: results.page,
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ error: 'Error fetching popular movies' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await movieService.getMovieDetails(movieId);
    res.json({
      ...movie,
      poster_url: movieService.getImageUrl(movie.poster_path),
      backdrop_url: movieService.getImageUrl(movie.backdrop_path),
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Error fetching movie details' });
  }
});

// Get genres
router.get('/genres/list', async (req, res) => {
  try {
    const genres = await movieService.getGenres();
    res.json({ genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Error fetching genres' });
  }
});

module.exports = router;

