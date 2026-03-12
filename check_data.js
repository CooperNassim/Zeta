(async () => {
  try {
    const response = await fetch('http://localhost:3001/api/daily_work_data');
    const data = await response.json();
    console.log('有效数据总数:', data.data?.length || 0);

    if (data.data && data.data.length > 0) {
      console.log('前5条日期:');
      data.data.slice(0, 5).forEach(d => {
        console.log('  -', d.date, 'deleted:', d.deleted);
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
