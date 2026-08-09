/**
 * CATEGORY E — Time-Based Signals
 * Max: 10 pts | Weight: 10% of final score
 *
 * Rules: R17, R18
 */

const { ruleResult, safeRun } = require('./ruleHelpers');

const CATEGORY = 'E';

// Suspicious hour window: midnight to 5 AM (inclusive)
const SUSPICIOUS_HOUR_START = 0;
const SUSPICIOUS_HOUR_END   = 5;

/**
 * R17 — Midnight / Unusual Hour Transaction (+4)
 * Transaction timestamp falls between 00:00 and 05:00 local time.
 * UPI fraud disproportionately occurs in late-night/early-morning hours
 * when victims are asleep and can't notice unauthorized activity.
 */
function R17_unusualHourTransaction(timestamp) {
  return safeRun(() => {
    const hour = new Date(timestamp).getHours(); // 0-23
    const triggered = hour >= SUSPICIOUS_HOUR_START && hour <= SUSPICIOUS_HOUR_END;

    return ruleResult(
      triggered, 4,
      'UNUSUAL_HOUR_TRANSACTION', 'R17', CATEGORY,
      triggered
        ? `Transaction at ${String(hour).padStart(2, '0')}:00 — falls in high-risk window (00:00–05:00)`
        : `Transaction at ${String(hour).padStart(2, '0')}:00 — within normal business hours`
    );
  }, 'R17', CATEGORY);
}

/**
 * R18 — High Amount + Odd Hour Combined (+6)
 * Amount > ₹5,000 AND timestamp between 00:00–05:00.
 * Stacks with R17 intentionally (combined = 10 pts = full category max).
 * Combining high value with an odd hour dramatically elevates risk —
 * legitimate large midnight transfers are exceedingly rare in retail UPI.
 */
function R18_highAmountOddHour(amount, timestamp) {
  return safeRun(() => {
    const hour = new Date(timestamp).getHours();
    const isOddHour  = hour >= SUSPICIOUS_HOUR_START && hour <= SUSPICIOUS_HOUR_END;
    const isHighAmt  = amount > 5000;
    const triggered  = isOddHour && isHighAmt;

    return ruleResult(
      triggered, 6,
      'HIGH_AMOUNT_ODD_HOUR', 'R18', CATEGORY,
      triggered
        ? `₹${amount.toLocaleString('en-IN')} sent at ${String(hour).padStart(2, '0')}:00 — high-value odd-hour combination`
        : `Amount or hour alone not flagged by R18 (needs both >₹5K and 00–05 window)`
    );
  }, 'R18', CATEGORY);
}

/**
 * Evaluate all Category E rules and return array of rule results.
 */
function evaluateTimeRules({ amount, timestamp }) {
  return [
    R17_unusualHourTransaction(timestamp),
    R18_highAmountOddHour(amount, timestamp),
  ];
}

module.exports = { evaluateTimeRules };