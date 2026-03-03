const https = require('https');
const payload = JSON.stringify({
    message: 'test message',
    history: [{ role: 'assistant', content: 'test' }],
    context: [],
    userName: 'test user',
    isInitial: false,
    track: 'casual'
});
const req = https.request('https://project3-nine-phi.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('RES:', res.statusCode, body));
});
req.on('error', console.error);
req.write(payload);
req.end();
