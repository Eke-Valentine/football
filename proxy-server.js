/**
 * The Pitch — API Proxy Server
 * ─────────────────────────────────────────────
 * Adds CORS headers so the browser can call
 * API-Football from a static frontend.
 *
 * DEPLOY IN 2 MINUTES:
 *   1. Push this folder to a GitHub repo
 *   2. Go to railway.app → New Project → Deploy from GitHub
 *   3. Railway auto-detects Node, runs `npm start`
 *   4. Copy the generated URL (e.g. https://thepitch-proxy.up.railway.app)
 *   5. In worldcup2026.html set:  var PROXY_URL = 'https://your-url.up.railway.app';
 *
 * FREE ALTERNATIVES: Render.com, Fly.io, Vercel (rename to api/index.js)
 */

const express = require('express');
const cors    = require('cors');
const https   = require('https');

const app = express();
app.use(cors({ origin: '*' }));

// ─── Keys ──────────────────────────────────────────────────────
const APIFOOT_KEY = process.env.APIFOOT_KEY || 'b7a40304581b6e9ecbeff8427a5a790f';
const WC_LEAGUE   = 1;    // FIFA World Cup
const WC_SEASON   = 2026;

// ─── Helpers ───────────────────────────────────────────────────
function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];
}

function apiFetch(path, res) {
  const url     = new URL('https://v3.football.api-sports.io' + path);
  const options = {
    hostname: url.hostname,
    path:     url.pathname + url.search,
    method:   'GET',
    headers:  {
      'x-apisports-key': APIFOOT_KEY,
      'User-Agent':      'ThePitch-Proxy/1.0',
    },
  };

  const req = https.request(options, (upstream) => {
    let body = '';
    upstream.on('data', (chunk) => { body += chunk; });
    upstream.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.send(body);
    });
  });

  req.on('error', (err) => {
    console.error('[proxy error]', err.message);
    res.status(502).json({ error: err.message });
  });

  req.end();
}

// ─── Routes ────────────────────────────────────────────────────

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'ThePitch Proxy', time: new Date().toISOString() });
});

// Today's + yesterday's + tomorrow's fixtures
app.get('/api/fixtures', (_req, res) => {
  const from = isoDate(-1);
  const to   = isoDate(+1);
  apiFetch(`/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&from=${from}&to=${to}`, res);
});

// Top scorers
app.get('/api/scorers', (_req, res) => {
  apiFetch(`/players/topscorers?league=${WC_LEAGUE}&season=${WC_SEASON}`, res);
});

// Group standings
app.get('/api/standings', (_req, res) => {
  apiFetch(`/standings?league=${WC_LEAGUE}&season=${WC_SEASON}`, res);
});

// Live matches
app.get('/api/live', (_req, res) => {
  apiFetch(`/fixtures?live=all&league=${WC_LEAGUE}`, res);
});

// ─── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ ThePitch proxy running → http://localhost:${PORT}`);
  console.log(`   /api/fixtures   — today's match scores`);
  console.log(`   /api/scorers    — top scorers`);
  console.log(`   /api/standings  — group standings`);
  console.log(`   /api/live       — live match feed`);
});
