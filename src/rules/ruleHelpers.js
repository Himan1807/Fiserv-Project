/**
 * LAYER: Rule Engine Utilities
 * Standard structures and safe execution wrapper for all rules.
 */

/**
 * Standard result every rule must return.
 * @param {boolean} triggered
 * @param {number}  points     - Raw points this rule contributes (pre-normalization)
 * @param {string}  reasonCode - Machine-readable code for UI display
 * @param {string}  ruleId     - e.g. "R1", "R14"
 * @param {string}  category   - "A" | "B" | "C" | "D" | "E" | "F"
 * @param {string}  description - Human-readable explanation shown in dashboard
 */
function ruleResult(triggered, points, reasonCode, ruleId, category, description) {
  return { triggered, points: triggered ? points : 0, reasonCode, ruleId, category, description };
}

/**
 * Safely execute a rule function.
 * If a rule throws, it returns a non-triggered result instead of
 * crashing the entire scoring pipeline.
 */
function safeRun(ruleFn, ruleId, category) {
  try {
    return ruleFn();
  } catch (err) {
    console.error(`[RuleEngine] Rule ${ruleId} threw an error:`, err.message);
    return ruleResult(false, 0, 'RULE_ERROR', ruleId, category, `Rule ${ruleId} failed to evaluate`);
  }
}

/**
 * Category configuration — weights and max points per category.
 * These drive the final 0-100 score normalization.
 *
 * finalScore += (rawCategoryPoints / categoryMax) * categoryWeight
 */
const CATEGORY_CONFIG = {
  A: { name: 'Amount Signals',         weight: 25, max: 25 },
  B: { name: 'Velocity / Frequency',   weight: 20, max: 20 },
  C: { name: 'Behavioral History',     weight: 20, max: 20 },
  D: { name: 'Device Signals',         weight: 20, max: 20 },
  E: { name: 'Time-Based Signals',     weight: 10, max: 10 },
  F: { name: 'Merchant / Payee Risk',  weight: 5,  max: 5  },
};

/**
 * Compute the weighted score contribution for a single category.
 * Raw points are capped at the category max before normalization.
 *
 * @param {string} category  - Category key "A"..."F"
 * @param {number} rawPoints - Sum of points from triggered rules in this category
 * @returns {number} Weighted contribution to final score (float)
 */
function computeCategoryScore(category, rawPoints) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return 0;
  const capped = Math.min(rawPoints, config.max);
  return (capped / config.max) * config.weight;
}

module.exports = { ruleResult, safeRun, CATEGORY_CONFIG, computeCategoryScore };