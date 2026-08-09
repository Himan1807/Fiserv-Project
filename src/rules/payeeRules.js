/**
 * CATEGORY F — Merchant / Payee Risk Signals
 * Max: 5 pts | Weight: 5% of final score
 *
 * Rules: R20, R21, R22
 */

const { ruleResult, safeRun } = require('./ruleHelpers');
const { getPayeeRiskCount, isPayeeSeen } = require('../store/inMemoryRiskStore');

const CATEGORY = 'F';

// Known legitimate UPI VPA suffixes (major Indian payment handles)
const KNOWN_UPI_HANDLES = [
  '@ybl',       // PhonePe
  '@paytm',     // Paytm
  '@upi',       // Generic
  '@oksbi',     // Google Pay / SBI
  '@okaxis',    // Google Pay / Axis
  '@okhdfcbank',// Google Pay / HDFC
  '@okicici',   // Google Pay / ICICI
  '@ibl',       // IndusInd
  '@axl',       // Axis
  '@aubank',    // AU Small Finance
  '@freecharge', // Freecharge
  '@apl',       // Amazon Pay
  '@jupiteraxis',// Jupiter
  '@sbi',       // SBI direct
  '@cnrb',      // Canara Bank
];

/**
 * R20 — Payee Flagged by Prior High-Risk Transactions (+2)
 * This payee_id has appeared in 2+ prior transactions that scored > 60.
 * A payee repeatedly appearing in flagged transactions = probable mule or scam endpoint.
 * Creates a dynamic "hot payee" effect — payee reputation degrades in real time.
 *
 * NOTE: payee_risk_counter is updated POST-scoring, so this reads
 * the count from PREVIOUS transactions only (correct behavior).
 */
function R20_hotPayeeFlagged(payee_id) {
  return safeRun(() => {
    const count = getPayeeRiskCount(payee_id);
    const triggered = count >= 2;

    return ruleResult(
      triggered, 2,
      'HOT_PAYEE_REPEATED_FLAGS', 'R20', CATEGORY,
      triggered
        ? `Payee "${payee_id}" has appeared in ${count} prior high-risk transactions (score >60)`
        : `Payee "${payee_id}" has ${count} prior flag(s) — below threshold of 2`
    );
  }, 'R20', CATEGORY);
}

/**
 * R21 — Invalid / Suspicious VPA Format (+1)
 * payee_id does NOT contain '@' OR does not match any known UPI handle suffix.
 * Malformed or unusual VPAs may indicate test accounts, typosquat fraud,
 * or spoofed VPAs that mimic legitimate merchants.
 */
function R21_invalidVpaFormat(payee_id) {
  return safeRun(() => {
    const hasAt = payee_id.includes('@');
    const hasKnownHandle = KNOWN_UPI_HANDLES.some(h =>
      payee_id.toLowerCase().endsWith(h)
    );
    const triggered = !hasAt || !hasKnownHandle;

    return ruleResult(
      triggered, 1,
      'INVALID_VPA_FORMAT', 'R21', CATEGORY,
      triggered
        ? `Payee VPA "${payee_id}" — ${!hasAt ? 'missing @ symbol' : 'unrecognized UPI handle suffix'}`
        : `Payee VPA "${payee_id}" matches a known UPI handle format`
    );
  }, 'R21', CATEGORY);
}

/**
 * R22 — First-Time Payee in System (+2)
 * This payee_id has NEVER appeared in any transaction across ALL users in the system.
 * Newly appearing payees with no transaction history receiving significant money
 * deserve elevated scrutiny — could be a freshly created mule account.
 *
 * NOTE: all_payees is updated POST-scoring, so the first transaction to a new
 * payee correctly triggers this. Subsequent transactions to the same payee will not.
 */
function R22_firstTimePayeeSystem(payee_id) {
  return safeRun(() => {
    const seen = isPayeeSeen(payee_id);
    const triggered = !seen;

    return ruleResult(
      triggered, 2,
      'FIRST_TIME_PAYEE_SYSTEM', 'R22', CATEGORY,
      triggered
        ? `Payee "${payee_id}" has never been seen in this system before — no transaction history`
        : `Payee "${payee_id}" is a known payee in the system`
    );
  }, 'R22', CATEGORY);
}

/**
 * Evaluate all Category F rules and return array of rule results.
 */
function evaluatePayeeRules({ payee_id }) {
  return [
    R20_hotPayeeFlagged(payee_id),
    R21_invalidVpaFormat(payee_id),
    R22_firstTimePayeeSystem(payee_id),
  ];
}

module.exports = { evaluatePayeeRules };