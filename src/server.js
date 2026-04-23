/**
 * ENTRY POINT
 * Boots Express HTTP server and WebSocket server on the same port.
 * Wires all layers together.
 */

const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const path      = require('path');

const transactionRoutes = require('./routes/transactions');
const { initAlertPublisher } = require('./events/alertPublisher');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — permissive for hackathon / local dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/transactions', transactionRoutes);
app.use('/api/metrics',      transactionRoutes); // metrics endpoint lives in same router
app.use('/api/export',       transactionRoutes); // export endpoint lives in same router

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'UPI Fraud Detector' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── WebSocket Server ────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected — total: ${wss.clients.size}`);

  ws.on('close', () => {
    console.log(`[WS] Client disconnected — total: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });

  // Send welcome ping so client knows the connection is live
  ws.send(JSON.stringify({
    event: 'connected',
    data:  { message: 'UPI Fraud Detector WebSocket ready', timestamp: new Date().toISOString() }
  }));
});

// Inject WebSocket server into the alert publisher
initAlertPublisher(wss);

// ── Start ───────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       UPI FRAUD DETECTOR — BACKEND READY         ║');
  console.log(`║  HTTP :  http://localhost:${PORT}                    ║`);
  console.log(`║  WS   :  ws://localhost:${PORT}                      ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  POST /api/transactions/evaluate                 ║');
  console.log('║  GET  /api/transactions/flagged                  ║');
  console.log('║  GET  /api/transactions/recent                   ║');
  console.log('║  GET  /api/transactions/metrics                  ║');
  console.log('║  GET  /api/export/csv                            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, server };