const express = require('express');
const recommendationService = require('../services/recommendationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get personalized recommendations
router.get('/', async (req, res) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.id);
    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Error generating recommendations' });
  }
});

module.exports = router;

