const regex = /^(?:\/([^/]+?))\/bulk\/delete\/?$/i;
console.log('Match /daily_work_data/bulk/delete:', regex.test('/daily_work_data/bulk/delete'));
console.log('Exec /daily_work_data/bulk/delete:', regex.exec('/daily_work_data/bulk/delete'));
console.log('Match /api/daily_work_data/bulk/delete:', regex.test('/api/daily_work_data/bulk/delete'));
