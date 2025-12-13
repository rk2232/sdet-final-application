const db = require('../config/database');

class WatchHistory {
  static async create(userId, movieId, movieTitle, rating = null) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO watch_history (user_id, movie_id, movie_title, rating) VALUES (?, ?, ?, ?)',
        [userId, movieId, movieTitle, rating],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, movieId, movieTitle, rating });
        }
      );
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async updateRating(id, rating) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE watch_history SET rating = ? WHERE id = ?',
        [rating, id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM watch_history WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static async getAverageRating(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM watch_history WHERE user_id = ? AND rating IS NOT NULL',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async getGenreStats(userId) {
    // This would typically join with movie data, but for simplicity we'll return basic stats
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT movie_id, movie_title, rating FROM watch_history WHERE user_id = ? AND rating IS NOT NULL',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = WatchHistory;

