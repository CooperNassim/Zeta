// 清理浏览器缓存的脚本 (不使用 eval)
// 在浏览器控制台(F12)中执行以下代码:

console.log('开始清理缓存...\n');

// 清理 localStorage
const storageKeys = Object.keys(localStorage);
console.log('localStorage 中的键:', storageKeys);

// 删除所有 localStorage 数据
localStorage.clear();
console.log('✅ localStorage 已清空\n');

// 清理 sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage 已清空\n');

// 清理 IndexedDB (不使用 eval)
if (window.indexedDB) {
  const databases = window.indexedDB.databases ? window.indexedDB.databases() : [];
  if (databases instanceof Promise) {
    databases.then(dbList => {
      dbList.forEach(db => {
        window.indexedDB.deleteDatabase(db.name);
        console.log(`✅ 已删除 IndexedDB 数据库: ${db.name}`);
      });
    }).catch(() => {
      console.log('⚠️ IndexedDB 清理跳过');
    });
  } else {
    databases.forEach(db => {
      window.indexedDB.deleteDatabase(db.name);
      console.log(`✅ 已删除 IndexedDB 数据库: ${db.name}`);
    });
  }
} else {
  console.log('⚠️ IndexedDB 不可用');
}

console.log('\n缓存清理完成!');
console.log('请按 Ctrl+Shift+R 强制刷新页面');
