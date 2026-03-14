const fs = require('fs');
const sql = fs.readFileSync('migration_complete_v3.sql', 'utf8');
let fixedSql = sql;

// 替换 INTEGER PRIMARY KEY DEFAULT nextval -> SERIAL PRIMARY KEY
fixedSql = fixedSql.replace(/id INTEGER PRIMARY KEY DEFAULT nextval\('[^']+'::regclass\)/g, 'id SERIAL PRIMARY KEY');

// 替换 BIGINT PRIMARY KEY DEFAULT nextval -> BIGSERIAL PRIMARY KEY
fixedSql = fixedSql.replace(/id BIGINT PRIMARY KEY DEFAULT nextval\('[^']+'::regclass\)/g, 'id BIGSERIAL PRIMARY KEY');

fs.writeFileSync('migration_complete_v3_fixed.sql', fixedSql);
console.log('Fixed file created: migration_complete_v3_fixed.sql');
