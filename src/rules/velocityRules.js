/**
 * CATEGORY B — Velocity / Frequency Signals
 * Max: 20 pts | Weight: 20% of final score
 *
 * Rules: R5, R7, R8
 */

const { ruleResult, safeRun } = require('./ruleHelpers');
const { getUserTransactionsInWindow } = require('../store/inMemoryRiskStore');

const CATEGORY = 'B';

const WINDOWS = {
  TWO_MIN:  2  * 60 * 1000,
  FIVE_MIN: 5  * 60 * 1000,
  TEN_MIN:  10 * 60 * 1000,
};

/**
 * R5 — High-Frequency Burst (+10)
 * More than 5 transactions from the same payer_id within any 5-minute window.
 * Bots and automated fraud tools generate rapid-fire transactions.
 * Humans rarely send 5+ UPI payments in 5 minutes legitimately.
 */
function R5_highFrequencyBurst(payer_id, timestamp) {
  return safeRun(() => {
    const recent = getUserTransactionsInWindow(payer_id, WINDOWS.FIVE_MIN, timestamp);
    const count = recent.length;
    const triggered = count > 5;

    return ruleResult(
      triggered, 10,
      'HIGH_FREQUENCY_BURST', 'R5', CATEGORY,
      `${count} transactions in the last 5 minutes (threshold: >5) — automated bot pattern suspected`
    );
  }, 'R5', CATEGORY);
}

/**
 * R7 — Multi-Payee Spray (+7)
 * Same payer sends to 4+ different payees within 10 minutes.
 * Fraudsters "spray" stolen funds across multiple mule accounts simultaneously.
 * Legitimate users rarely pay 4+ different merchants in 10 minutes.
 */
function R7_multiPayeeSpray(payer_id, timestamp) {
  return safeRun(() => {
    const recent = getUserTransactionsInWindow(payer_id, WINDOWS.TEN_MIN, timestamp);
    const uniquePayees = new Set(recent.map(tx => tx.payee_id));
    const count = uniquePayees.size;
    const triggered = count >= 4;

    return ruleResult(
      triggered, 7,
      'MULTI_PAYEE_SPRAY', 'R7', CATEGORY,
      `Sent to ${count} unique payees in the last 10 minutes — money spraying pattern detected`
    );
  }, 'R7', CATEGORY);
}

/**
 * R8 — Repeated Retry Pattern (+3)
 * Same payer → same payee pair, 3+ times within 2 minutes.
 * Indicates failed transaction retries, double-spend attempts, or automated scripts
 * probing whether an account / payee is active.
 */
function R8_repeatedRetryPattern(payer_id, payee_id, timestamp) {
  return safeRun(() => {
    const recent = getUserTransactionsInWindow(payer_id, WINDOWS.TWO_MIN, timestamp);
    const retries = recent.filter(tx => tx.payee_id === payee_id);
    const count = retries.length;
    const triggered = count >= 3;

    return ruleResult(
      triggered, 3,
      'REPEATED_RETRY_SAME_PAYEE', 'R8', CATEGORY,
      `${count} repeated attempts to payee ${payee_id} within 2 minutes — retry/probe pattern`
    );
  }, 'R8', CATEGORY);
}

/**
 * Evaluate all Category B rules and return array of rule results.
 */
function evaluateVelocityRules({ payer_id, payee_id, timestamp }) {
  return [
    R5_highFrequencyBurst(payer_id, timestamp),
    R7_multiPayeeSpray(payer_id, timestamp),
    R8_repeatedRetryPattern(payer_id, payee_id, timestamp),
  ];
}

module.exports = { evaluateVelocityRules };