const db = require('./backend/src/database/connection.js');

db.query('SELECT id, name, min_score, max_score FROM psychological_indicators', (err, results) => {
  if (err) console.error(err);
  else console.table(results);
  process.exit();
});
