/**
 * Express and WebSocket entry point for the fraud-scoring API.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const transactionRoutes = require('./routes/transactions');
const { initAlertPublisher } = require('./events/alertPublisher');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin);
}

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ success: false, message: 'Origin is not allowed' });
  }

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/metrics', transactionRoutes);
app.use('/api/export', transactionRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'UPI Fraud Detector',
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

const wss = new WebSocket.Server({
  server,
  verifyClient: ({ origin }, done) => {
    if (isAllowedOrigin(origin)) {
      done(true);
      return;
    }

    done(false, 403, 'Origin is not allowed');
  },
});

wss.on('connection', ws => {
  ws.on('error', err => {
    console.error('[WebSocket] Client error:', err.message);
  });

  ws.send(JSON.stringify({
    event: 'connected',
    data: {
      message: 'UPI Fraud Detector WebSocket ready',
      timestamp: new Date().toISOString(),
    },
  }));
});

initAlertPublisher(wss);

server.listen(PORT, () => {
  console.log(`UPI Fraud Detector API listening at http://localhost:${PORT}`);
});

module.exports = { app, server };
