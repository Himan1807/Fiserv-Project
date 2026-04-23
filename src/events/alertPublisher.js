/**
 * LAYER: Real-time Notification
 * Manages WebSocket client registry and publishes scored/flagged events.
 *
 * Events emitted:
 *   transaction_scored  — every evaluated transaction (all risk levels)
 *   transaction_flagged — only HIGH and CRITICAL transactions (score >= 60)
 */

let wss = null; // WebSocket.Server — injected at startup

/**
 * Register the WebSocket server instance.
 * Called once during server startup.
 */
function initAlertPublisher(websocketServer) {
  wss = websocketServer;
  console.log('[AlertPublisher] WebSocket publisher initialized');
}

/**
 * Send a JSON payload to all connected WebSocket clients.
 * Silently skips dead connections.
 */
function broadcast(payload) {
  if (!wss) return;

  const message = JSON.stringify(payload);

  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN === 1
      try {
        client.send(message);
      } catch (err) {
        console.error('[AlertPublisher] Failed to send to client:', err.message);
      }
    }
  });
}

/**
 * Publish a scored transaction event.
 * Always emits 'transaction_scored'.
 * Also emits 'transaction_flagged' if score >= 60.
 *
 * Payload is a lightweight summary — not the full result object —
 * to keep WebSocket messages small and fast.
 */
function publishScoredEvent(result) {
  const { id, transaction, finalScore, riskLevel, reasonCodes, processedAt, categoryBreakdown } = result;

  const summary = {
    id,
    payer_id:   transaction.payer_id,
    payee_id:   transaction.payee_id,
    amount:     transaction.amount,
    location:   transaction.location,
    device_id:  transaction.device_id,
    timestamp:  transaction.timestamp,
    finalScore,
    riskLevel,
    reasonCodes,
    categoryBreakdown,
    processedAt,
  };

  // Always broadcast every scored transaction
  broadcast({ event: 'transaction_scored', data: summary });

  // Additionally broadcast flagged transactions (HIGH + CRITICAL)
  if (finalScore >= 60) {
    broadcast({ event: 'transaction_flagged', data: summary });
  }
}

module.exports = { initAlertPublisher, publishScoredEvent };