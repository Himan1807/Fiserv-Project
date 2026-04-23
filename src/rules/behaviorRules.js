/**
 * CATEGORY C — Behavioral / Historical Pattern Signals
 * Max: 20 pts | Weight: 20% of final score
 *
 * Rules: R10, R11
 */

const { ruleResult, safeRun } = require('./ruleHelpers');
const {
  getUser,
  getUserTransactionsInWindow,
  getDaysSinceFirstTx,
} = require('../store/inMemoryRiskStore');

const CATEGORY = 'C';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * R10 — Dormant Account Sudden Activity (+8)
 * User has NO transactions in the last 7 days AND current amount > ₹5,000.
 * Dormant accounts that suddenly wake up with a large transfer are a strong
 * indicator of account takeover — the original owner stopped using it,
 * a fraudster gained access and is draining it.
 */
function R10_dormantAccountActivity(payer_id, amount, timestamp) {
  return safeRun(() => {
    const user = getUser(payer_id);

    // Brand new user (no history) also qualifies — treat as dormant
    if (!user || user.transactions.length === 0) {
      const triggered = amount > 5000;
      return ruleResult(
        triggered, 8,
        'DORMANT_ACCOUNT_SPIKE', 'R10', CATEGORY,
        `No transaction history found for payer — first-time large transfer of ₹${amount.toLocaleString('en-IN')}`
      );
    }

    const recentActivity = getUserTransactionsInWindow(payer_id, SEVEN_DAYS_MS, timestamp);
    const isDormant = recentActivity.length === 0;
    const isHighAmount = amount > 5000;
    const triggered = isDormant && isHighAmount;

    return ruleResult(
      triggered, 8,
      'DORMANT_ACCOUNT_SPIKE', 'R10', CATEGORY,
      `Account inactive for 7+ days, now sending ₹${amount.toLocaleString('en-IN')} — possible account takeover`
    );
  }, 'R10', CATEGORY);
}

/**
 * R11 — Location Drift from History (+12)
 * Current location NOT in user's known locations,
 * AND user has ≥15 days of transaction history (established pattern exists),
 * AND amount > ₹15,000 (high-stakes drift only).
 *
 * Rationale for thresholds:
 * - 15-day guard: prevents false positives on new users who haven't built location history
 * - ₹15,000 guard: filters out legitimate travel + small purchase combos
 * - Together: flags only established users sending big money from new locations
 */
function R11_locationDriftHighAmount(payer_id, location, amount, timestamp) {
  return safeRun(() => {
    const user = getUser(payer_id);

    if (!user) {
      return ruleResult(
        false, 0,
        'LOCATION_DRIFT_HIGH_AMOUNT', 'R11', CATEGORY,
        'No location history available for this payer'
      );
    }

    const daysSinceFirst = getDaysSinceFirstTx(payer_id, timestamp);
    const knownLocations = user.known_locations;

    const isNewLocation   = !knownLocations.has(location);
    const hasEstablishedHistory = daysSinceFirst >= 15;
    const isHighAmount    = amount > 15000;
    const triggered       = isNewLocation && hasEstablishedHistory && isHighAmount;

    const knownList = [...knownLocations].join(', ') || 'none';

    return ruleResult(
      triggered, 12,
      'LOCATION_DRIFT_HIGH_AMOUNT', 'R11', CATEGORY,
      `Transaction from new location "${location}" — user's known locations: [${knownList}]. ` +
      `${Math.floor(daysSinceFirst)}d history, ₹${amount.toLocaleString('en-IN')} amount`
    );
  }, 'R11', CATEGORY);
}

/**
 * Evaluate all Category C rules and return array of rule results.
 */
function evaluateBehaviorRules({ payer_id, location, amount, timestamp }) {
  return [
    R10_dormantAccountActivity(payer_id, amount, timestamp),
    R11_locationDriftHighAmount(payer_id, location, amount, timestamp),
  ];
}

module.exports = { evaluateBehaviorRules };