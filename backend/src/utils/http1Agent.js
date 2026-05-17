const https = require('https');

// Force HTTP/1.1 for all fetch calls globally (fixes Eastmoney API compatibility)
// Node.js 20+ has undici built-in via 'node:undici'
const { Agent, setGlobalDispatcher } = require('node:undici');

const http1Agent = new Agent({
  allowH2: false,
  pipelining: 0,
});

setGlobalDispatcher(http1Agent);

console.log('[http1Agent] Global dispatcher set to HTTP/1.1 only');
