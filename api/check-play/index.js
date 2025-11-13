// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'plays.json');
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ensure plays.json exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ plays: {} }, null, 2));

// Helper read/write
function readData(){
  try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch(e) { return { plays:{} }; }
}
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// simple health
app.get('/api/ping', (req,res) => res.json({ ok:true }));

// check if IP allowed
app.post('/api/check-play', (req,res) => {
  const ip = (req.body && req.body.ip) || req.ip || req.headers['x-forwarded-for'] || null;
  if (!ip) return res.status(400).json({ allowed:false, reason:'no-ip' });

  const data = readData();
  const played = data.plays[ip];
  if (played && played.length > 0){
    return res.json({ allowed:false, reason:'IP đã chơi rồi' });
  }
  return res.json({ allowed:true });
});

// record that this IP has played (mode: 'type1' or 'type2')
app.post('/api/record-play', (req,res) => {
  const ip = (req.body && req.body.ip) || req.ip || req.headers['x-forwarded-for'] || null;
  const mode = req.body && req.body.mode;
  if (!ip) return res.status(400).json({ ok:false, reason:'no-ip' });

  const data = readData();
  data.plays[ip] = data.plays[ip] || [];
  data.plays[ip].push({ mode: mode || 'unknown', at: (new Date()).toISOString() });
  try {
    writeData(data);
    return res.json({ ok:true });
  } catch(e){
    console.error('Write failed', e);
    return res.status(500).json({ ok:false, reason:'write-failed' });
  }
});

app.listen(PORT, ()=> console.log(`IP-guard server listening on ${PORT}`));