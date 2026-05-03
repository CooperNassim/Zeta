const {pool} = require('./src/config/database');
pool.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'trade_records' 
  AND column_name LIKE '%sell%' 
  ORDER BY column_name
`).then(r => { 
  r.rows.forEach(c => console.log(c.column_name, c.data_type)); 
}).catch(e => console.error(e.message)).finally(() => pool.end());
