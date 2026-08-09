/**
 * LAYER: State Store
 * Single source of truth for all in-memory state.
 * Rules READ from this store BEFORE scoring.
 * Store is UPDATED only AFTER final score is computed.
 */

const MAX_TX_PER_USER = 30;        // Rolling window cap per user
const MAX_RECENT_EVALUATED = 200;  // Global dashboard history cap

const store = {
  // ── Per-payer state ─────────────────────────────────────────────
  users: {},
  // Shape: {
  //   [payer_id]: {
  //     transactions:    [{ amount, timestamp, payee_id, device_id, location }],
  //     known_devices:   Set<string>,
  //     known_payees:    Set<string>,
  //     known_locations: Set<string>,
  //     first_tx_time:   number (ms epoch),
  //   }
  // }

  // ── Global device registry ───────────────────────────────────────
  device_payers: {},
  // Shape: { [device_id]: Set<payer_id> }

  // ── Global payee registries ──────────────────────────────────────
  payee_risk_counter: {},
  // Shape: { [payee_id]: number }  — incremented when score > 60

  all_payees: new Set(),
  // All payee_ids ever seen across the system

  // ── Dashboard feeds ──────────────────────────────────────────────
  recent_evaluated: [],
  // Last MAX_RECENT_EVALUATED scored transactions (all risk levels)

  flagged_transactions: [],
  // Only HIGH + CRITICAL transactions (score >= 60)
};

// ────────────────────────────────────────────────────────────────────
// READ helpers — used by rule engine before scoring
// ────────────────────────────────────────────────────────────────────

function getUser(payer_id) {
  return store.users[payer_id] || null;
}

function getUserTransactionsInWindow(payer_id, windowMs, currentTimestamp) {
  const user = getUser(payer_id);
  if (!user) return [];
  const now = new Date(currentTimestamp).getTime();
  return user.transactions.filter(tx =>
    now - new Date(tx.timestamp).getTime() <= windowMs
  );
}

function getDevicePayers(device_id) {
  return store.device_payers[device_id] || new Set();
}

function getPayeeRiskCount(payee_id) {
  return store.payee_risk_counter[payee_id] || 0;
}

function isPayeeSeen(payee_id) {
  return store.all_payees.has(payee_id);
}

function getDaysSinceFirstTx(payer_id, currentTimestamp) {
  const user = getUser(payer_id);
  if (!user || !user.first_tx_time) return 0;
  const now = new Date(currentTimestamp).getTime();
  return (now - user.first_tx_time) / (1000 * 60 * 60 * 24);
}

// ────────────────────────────────────────────────────────────────────
// WRITE helpers — called ONLY after final score is computed
// ────────────────────────────────────────────────────────────────────

function updateStoreAfterScoring(tx, finalScore, scoredResult) {
  const { payer_id, payee_id, device_id, location, timestamp, amount } = tx;

  // ── Initialize user if first time ───────────────────────────────
  if (!store.users[payer_id]) {
    store.users[payer_id] = {
      transactions:    [],
      known_devices:   new Set(),
      known_payees:    new Set(),
      known_locations: new Set(),
      first_tx_time:   new Date(timestamp).getTime(),
    };
  }

  const user = store.users[payer_id];

  // ── Append transaction (rolling window) ─────────────────────────
  user.transactions.push({ amount, timestamp, payee_id, device_id, location });
  if (user.transactions.length > MAX_TX_PER_USER) {
    user.transactions.shift();
  }

  // ── Register new knowns ──────────────────────────────────────────
  user.known_devices.add(device_id);
  user.known_payees.add(payee_id);
  user.known_locations.add(location);

  // ── Global device → payer registry ──────────────────────────────
  if (!store.device_payers[device_id]) {
    store.device_payers[device_id] = new Set();
  }
  store.device_payers[device_id].add(payer_id);

  // ── Global payee registries ──────────────────────────────────────
  store.all_payees.add(payee_id);
  if (finalScore > 60) {
    store.payee_risk_counter[payee_id] =
      (store.payee_risk_counter[payee_id] || 0) + 1;
  }

  // ── Dashboard feeds ──────────────────────────────────────────────
  store.recent_evaluated.unshift(scoredResult);
  if (store.recent_evaluated.length > MAX_RECENT_EVALUATED) {
    store.recent_evaluated.pop();
  }

  if (finalScore >= 60) {
    store.flagged_transactions.unshift(scoredResult);
    // No cap on flagged — these are critical records
  }
}

// ────────────────────────────────────────────────────────────────────
// METRICS helper — for GET /api/metrics
// ────────────────────────────────────────────────────────────────────

function getMetrics() {
  const all = store.recent_evaluated;
  const total = all.length;

  const byRisk = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  let scoreSum = 0;

  for (const r of all) {
    byRisk[r.riskLevel] = (byRisk[r.riskLevel] || 0) + 1;
    scoreSum += r.finalScore;
  }

  // Top 5 hot payees
  const hotPayees = Object.entries(store.payee_risk_counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([payee_id, count]) => ({ payee_id, count }));

  // Top 5 shared devices
  const sharedDevices = Object.entries(store.device_payers)
    .filter(([, payers]) => payers.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5)
    .map(([device_id, payers]) => ({ device_id, payerCount: payers.size }));

  return {
    totalEvaluated: total,
    totalFlagged: store.flagged_transactions.length,
    averageScore: total ? Math.round(scoreSum / total) : 0,
    byRiskLevel: byRisk,
    flagRate: total ? `${((byRisk.HIGH + byRisk.CRITICAL) / total * 100).toFixed(1)}%` : '0%',
    hotPayees,
    sharedDevices,
    uniquePayers: Object.keys(store.users).length,
    uniquePayees: store.all_payees.size,
  };
}

function getFlaggedTransactions() {
  return store.flagged_transactions;
}

function getRecentEvaluated(limit = 50) {
  return store.recent_evaluated.slice(0, limit);
}

module.exports = {
  // Read
  getUser,
  getUserTransactionsInWindow,
  getDevicePayers,
  getPayeeRiskCount,
  isPayeeSeen,
  getDaysSinceFirstTx,
  // Write
  updateStoreAfterScoring,
  // Dashboard
  getMetrics,
  getFlaggedTransactions,
  getRecentEvaluated,
};