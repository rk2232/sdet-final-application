const db = require('../config/database');

// Migrate existing database to add google_id column
db.serialize(() => {
  // Check if google_id column exists
  db.get("PRAGMA table_info(users)", (err, row) => {
    if (err) {
      console.error('Error checking table info:', err);
      return;
    }

    // Check all columns
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('Error getting columns:', err);
        db.close();
        return;
      }

      const hasGoogleId = columns.some(col => col.name === 'google_id');
      const hasPasswordNotNull = columns.some(col => col.name === 'password' && col.notnull === 1);

      if (!hasGoogleId) {
        console.log('Adding google_id column to users table...');
        db.run('ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE', (err) => {
          if (err) {
            console.error('Error adding google_id column:', err);
          } else {
            console.log('Successfully added google_id column');
          }
        });
      }

      if (hasPasswordNotNull) {
        console.log('Making password column nullable for OAuth users...');
        // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        db.run(`
          CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            google_id TEXT UNIQUE,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating new users table:', err);
            db.close();
            return;
          }

          db.run(`
            INSERT INTO users_new (id, username, email, password, role, created_at)
            SELECT id, username, email, password, role, created_at FROM users
          `, (err) => {
            if (err) {
              console.error('Error copying data:', err);
              db.close();
              return;
            }

            db.run('DROP TABLE users', (err) => {
              if (err) {
                console.error('Error dropping old table:', err);
                db.close();
                return;
              }

              db.run('ALTER TABLE users_new RENAME TO users', (err) => {
                if (err) {
                  console.error('Error renaming table:', err);
                } else {
                  console.log('Successfully migrated users table');
                }
                db.close();
              });
            });
          });
        });
      } else {
        console.log('Database migration complete');
        db.close();
      }
    });
  });
});

