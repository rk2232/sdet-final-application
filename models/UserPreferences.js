const db = require('../config/database');

class UserPreferences {
  static async create(userId, preferences = {}) {
    const { favoriteGenres = '', favoriteActors = '', minRating = 0, preferredLanguage = 'en' } = preferences;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_preferences (user_id, favorite_genres, favorite_actors, min_rating, preferred_language) VALUES (?, ?, ?, ?, ?)',
        [userId, favoriteGenres, favoriteActors, minRating, preferredLanguage],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, ...preferences });
        }
      );
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async update(userId, preferences) {
    const { favoriteGenres, favoriteActors, minRating, preferredLanguage } = preferences;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE user_preferences 
         SET favorite_genres = COALESCE(?, favorite_genres),
             favorite_actors = COALESCE(?, favorite_actors),
             min_rating = COALESCE(?, min_rating),
             preferred_language = COALESCE(?, preferred_language)
         WHERE user_id = ?`,
        [favoriteGenres, favoriteActors, minRating, preferredLanguage, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static async delete(userId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM user_preferences WHERE user_id = ?', [userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = UserPreferences;

