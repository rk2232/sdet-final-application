const express = require('express');
const User = require('../models/User');
const WatchHistory = require('../models/WatchHistory');
const UserPreferences = require('../models/UserPreferences');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (password) updates.password = password;

    const result = await User.update(req.user.id, updates);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await User.findById(req.user.id);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Delete user account
router.delete('/profile', async (req, res) => {
  try {
    const result = await User.delete(req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await UserPreferences.findByUserId(req.user.id);
    if (!preferences) {
      // Create default preferences if they don't exist
      await UserPreferences.create(req.user.id);
      const newPreferences = await UserPreferences.findByUserId(req.user.id);
      return res.json(newPreferences);
    }
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Error fetching preferences' });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const { favoriteGenres, favoriteActors, minRating, preferredLanguage } = req.body;
    
    let preferences = await UserPreferences.findByUserId(req.user.id);
    
    if (!preferences) {
      await UserPreferences.create(req.user.id, {
        favoriteGenres,
        favoriteActors,
        minRating,
        preferredLanguage,
      });
    } else {
      await UserPreferences.update(req.user.id, {
        favoriteGenres,
        favoriteActors,
        minRating,
        preferredLanguage,
      });
    }

    preferences = await UserPreferences.findByUserId(req.user.id);
    res.json({ message: 'Preferences updated successfully', preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Error updating preferences' });
  }
});

// Get watch history
router.get('/watch-history', async (req, res) => {
  try {
    const history = await WatchHistory.findByUserId(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Error fetching watch history' });
  }
});

// Add to watch history
router.post('/watch-history', async (req, res) => {
  try {
    const { movieId, movieTitle, rating } = req.body;
    
    if (!movieId || !movieTitle) {
      return res.status(400).json({ error: 'Movie ID and title are required' });
    }

    const historyItem = await WatchHistory.create(req.user.id, movieId, movieTitle, rating);
    res.status(201).json({ message: 'Added to watch history', historyItem });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    res.status(500).json({ error: 'Error adding to watch history' });
  }
});

// Update rating in watch history
router.put('/watch-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating === undefined || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Valid rating (1-10) required' });
    }

    const result = await WatchHistory.updateRating(id, rating);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Watch history item not found' });
    }

    res.json({ message: 'Rating updated successfully' });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ error: 'Error updating rating' });
  }
});

// Delete from watch history
router.delete('/watch-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await WatchHistory.delete(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Watch history item not found' });
    }

    res.json({ message: 'Removed from watch history' });
  } catch (error) {
    console.error('Error deleting watch history:', error);
    res.status(500).json({ error: 'Error deleting watch history' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const history = await WatchHistory.findByUserId(req.user.id);
    const ratingStats = await WatchHistory.getAverageRating(req.user.id);
    
    res.json({
      totalWatched: history.length,
      averageRating: ratingStats.avgRating || 0,
      ratedCount: ratingStats.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Admin: Get all users (admin only)
router.get('/all', authorizeRole('admin'), async (req, res) => {
  try {
    const db = require('../config/database');
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT id, username, email, role, created_at FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

module.exports = router;

