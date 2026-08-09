/**
 * LAYER: Transaction Evaluation
 * Runs all risk-rule categories, computes the weighted score, persists state,
 * and emits real-time notifications.
 */

const crypto = require('crypto');

const { evaluateAmountRules } = require('../rules/amountRules');
const { evaluateVelocityRules } = require('../rules/velocityRules');
const { evaluateBehaviorRules } = require('../rules/behaviorRules');
const { evaluateDeviceRules } = require('../rules/deviceRules');
const { evaluateTimeRules } = require('../rules/timeRules');
const { evaluatePayeeRules } = require('../rules/payeeRules');
const { CATEGORY_CONFIG, computeCategoryScore } = require('../rules/ruleHelpers');
const { updateStoreAfterScoring } = require('../store/inMemoryRiskStore');
const { publishScoredEvent } = require('../events/alertPublisher');

const REQUIRED_FIELDS = [
  'payer_id',
  'payee_id',
  'amount',
  'location',
  'device_id',
  'timestamp',
];

function assertValidTransaction(input) {
  const missing = REQUIRED_FIELDS.filter(field =>
    input[field] === undefined || input[field] === null || input[field] === ''
  );

  if (missing.length) {
    throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount must be a positive number');
  }

  const timestamp = new Date(input.timestamp);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('timestamp must be a valid date/time string');
  }
}

function normalizeTransaction(input) {
  return {
    payer_id: String(input.payer_id).trim(),
    payee_id: String(input.payee_id).trim(),
    amount: Number(input.amount),
    location: String(input.location).trim(),
    device_id: String(input.device_id).trim(),
    timestamp: new Date(input.timestamp).toISOString(),
  };
}

function getRiskLevel(finalScore) {
  if (finalScore >= 80) return 'CRITICAL';
  if (finalScore >= 60) return 'HIGH';
  if (finalScore >= 30) return 'MEDIUM';
  return 'LOW';
}

function groupRulesByCategory(rules) {
  return Object.keys(CATEGORY_CONFIG).reduce((acc, category) => {
    acc[category] = rules.filter(rule => rule.category === category);
    return acc;
  }, {});
}

function buildCategoryBreakdown(rules) {
  const grouped = groupRulesByCategory(rules);

  return Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const categoryRules = grouped[category];
    const rawPoints = categoryRules.reduce((sum, rule) => sum + rule.points, 0);
    const weightedScore = computeCategoryScore(category, rawPoints);

    return {
      category,
      name: config.name,
      rawPoints,
      maxPoints: config.max,
      weight: config.weight,
      weightedScore: Number(weightedScore.toFixed(2)),
      triggeredRules: categoryRules.filter(rule => rule.triggered).map(rule => rule.ruleId),
    };
  });
}

function evaluateTransaction(input) {
  assertValidTransaction(input);
  const transaction = normalizeTransaction(input);

  const allRules = [
    ...evaluateAmountRules(transaction),
    ...evaluateVelocityRules(transaction),
    ...evaluateBehaviorRules(transaction),
    ...evaluateDeviceRules(transaction),
    ...evaluateTimeRules(transaction),
    ...evaluatePayeeRules(transaction),
  ];

  const categoryBreakdown = buildCategoryBreakdown(allRules);
  const finalScore = Math.round(
    categoryBreakdown.reduce((sum, category) => sum + category.weightedScore, 0)
  );
  const triggeredRules = allRules.filter(rule => rule.triggered);

  const result = {
    id: crypto.randomUUID(),
    transaction,
    finalScore,
    riskLevel: getRiskLevel(finalScore),
    processedAt: new Date().toISOString(),
    reasonCodes: triggeredRules.map(rule => rule.reasonCode),
    triggeredRules,
    allRules,
    categoryBreakdown,
  };

  updateStoreAfterScoring(transaction, finalScore, result);
  publishScoredEvent(result);

  return result;
}

module.exports = { evaluateTransaction };
