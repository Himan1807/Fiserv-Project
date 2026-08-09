/**
 * CATEGORY A — Amount Signals
 * Max: 25 pts | Weight: 25% of final score
 *
 * Rules: R1, R2, R3, R4
 */

const { ruleResult, safeRun } = require('./ruleHelpers');
const { getUser } = require('../store/inMemoryRiskStore');

const CATEGORY = 'A';

/**
 * R1 — Round-Number Structuring (+5)
 * Amount is an exact multiple of ₹5,000
 * Fraudsters use round numbers to stay under radar or split laundered funds cleanly.
 */
function R1_roundNumberStructuring(amount) {
  return safeRun(() => {
    const triggered = amount > 0 && amount % 5000 === 0;
    return ruleResult(
      triggered, 5,
      'ROUND_AMOUNT_STRUCTURING', 'R1', CATEGORY,
      `Amount ₹${amount.toLocaleString('en-IN')} is a round multiple of ₹5,000 — classic structuring pattern`
    );
  }, 'R1', CATEGORY);
}

/**
 * R2 — Just-Under-Limit Evasion (+8)
 * Amount between ₹9,000–₹9,999 (just below ₹10,000 scrutiny threshold)
 * Deliberate evasion of velocity checks set at ₹10K boundary.
 */
function R2_justUnderLimit(amount) {
  return safeRun(() => {
    const triggered = amount >= 9000 && amount <= 9999;
    return ruleResult(
      triggered, 8,
      'AMOUNT_THRESHOLD_EVASION', 'R2', CATEGORY,
      `Amount ₹${amount.toLocaleString('en-IN')} is suspiciously just below the ₹10,000 scrutiny threshold`
    );
  }, 'R2', CATEGORY);
}

/**
 * R3 — High Single Transaction (+7)
 * Amount > ₹50,000 in a single transaction.
 * Statistically rare for retail UPI — most users never exceed this in one payment.
 */
function R3_highSingleTransaction(amount) {
  return safeRun(() => {
    const triggered = amount > 50000;
    return ruleResult(
      triggered, 7,
      'HIGH_VALUE_TRANSACTION', 'R3', CATEGORY,
      `Amount ₹${amount.toLocaleString('en-IN')} exceeds ₹50,000 — high-value single transaction`
    );
  }, 'R3', CATEGORY);
}

/**
 * R4 — Sudden Amount Spike (+5)
 * Current amount > 5× the user's historical average.
 * A user sending 5× their normal amount is a strong behavioral anomaly.
 * Skipped if user has no prior history (can't compute baseline).
 */
function R4_suddenAmountSpike(amount, payer_id) {
  return safeRun(() => {
    const user = getUser(payer_id);

    if (!user || user.transactions.length === 0) {
      return ruleResult(
        false, 0,
        'AMOUNT_SPIKE_VS_HISTORY', 'R4', CATEGORY,
        'No transaction history available to detect spike'
      );
    }

    const avg = user.transactions.reduce((sum, tx) => sum + tx.amount, 0) / user.transactions.length;
    const triggered = avg > 0 && amount > 5 * avg;

    return ruleResult(
      triggered, 5,
      'AMOUNT_SPIKE_VS_HISTORY', 'R4', CATEGORY,
      `Amount ₹${amount.toLocaleString('en-IN')} is ${(amount / avg).toFixed(1)}× the user's avg of ₹${Math.round(avg).toLocaleString('en-IN')}`
    );
  }, 'R4', CATEGORY);
}

/**
 * Evaluate all Category A rules and return array of rule results.
 */
function evaluateAmountRules({ amount, payer_id }) {
  return [
    R1_roundNumberStructuring(amount),
    R2_justUnderLimit(amount),
    R3_highSingleTransaction(amount),
    R4_suddenAmountSpike(amount, payer_id),
  ];
}

module.exports = { evaluateAmountRules };