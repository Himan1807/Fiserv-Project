/**
 * CATEGORY D — Device Signals
 * Max: 20 pts | Weight: 20% of final score
 *
 * Rules: R13, R14, R15
 *
 * NOTE: R13 result is computed first and passed into R14
 * because R14 is a combined rule that stacks ON TOP of R13.
 * Both fire simultaneously — this is intentional.
 */

const { ruleResult, safeRun } = require('./ruleHelpers');
const { getUser, getDevicePayers } = require('../store/inMemoryRiskStore');

const CATEGORY = 'D';

/**
 * R13 — New Device Detected (+4)
 * The device_id is not in the user's known device history.
 * Device change is the primary indicator of account takeover.
 * A fraudster always uses their own device after stealing credentials.
 */
function R13_newDeviceDetected(payer_id, device_id) {
  return safeRun(() => {
    const user = getUser(payer_id);
    const knownDevices = user?.known_devices || new Set();
    const triggered = !knownDevices.has(device_id);

    const knownList = [...knownDevices].join(', ') || 'none';
    return ruleResult(
      triggered, 4,
      'NEW_DEVICE_DETECTED', 'R13', CATEGORY,
      triggered
        ? `Device "${device_id}" is new — user's known devices: [${knownList}]`
        : `Device "${device_id}" is a known device — no device anomaly`
    );
  }, 'R13', CATEGORY);
}

/**
 * R14 — New Device + New Payee Combined (+12)
 * The device_id is NEW **and** the payee_id is NEW (never paid before).
 * This is the canonical account-takeover-to-fraud pattern.
 * Both unknowns together = the genuine user's normal patterns are completely absent.
 * Stacks with R13's +4 intentionally (combined = 16 pts if both fire).
 */
function R14_newDeviceAndNewPayee(payer_id, device_id, payee_id, isNewDevice) {
  return safeRun(() => {
    // isNewDevice passed in from R13 result to avoid redundant lookup
    const user = getUser(payer_id);
    const knownPayees = user?.known_payees || new Set();
    const isNewPayee = !knownPayees.has(payee_id);
    const triggered = isNewDevice && isNewPayee;

    return ruleResult(
      triggered, 12,
      'NEW_DEVICE_AND_NEW_PAYEE', 'R14', CATEGORY,
      triggered
        ? `Both device "${device_id}" AND payee "${payee_id}" are new — high-confidence account takeover signal`
        : `Combined device+payee check: device new=${isNewDevice}, payee new=${isNewPayee}`
    );
  }, 'R14', CATEGORY);
}

/**
 * R15 — Device Shared Across Multiple Payers (+4)
 * The same device_id has been used by 3+ different payer_ids in the system.
 * A single device used by multiple "different" accounts = a fraud farm.
 * Legitimate device sharing (family phones) is rare and usually stays at 1-2.
 *
 * NOTE: This check uses the store state BEFORE the current transaction's
 * device is registered (happens post-scoring), so the count here is
 * the count of OTHER payers already using this device.
 */
function R15_deviceSharedAcrossPayers(device_id, payer_id) {
  return safeRun(() => {
    const payers = getDevicePayers(device_id);

    // Count payers excluding the current one (pre-registration check)
    const otherPayers = new Set([...payers].filter(p => p !== payer_id));
    const sharedCount = otherPayers.size + 1; // +1 for current payer
    const triggered = sharedCount >= 3;

    return ruleResult(
      triggered, 4,
      'DEVICE_SHARED_MULTI_PAYER', 'R15', CATEGORY,
      triggered
        ? `Device "${device_id}" used by ${sharedCount} different payers — fraud farm pattern`
        : `Device "${device_id}" used by ${sharedCount} payer(s) — within normal range`
    );
  }, 'R15', CATEGORY);
}

/**
 * Evaluate all Category D rules and return array of rule results.
 * R13 is evaluated first; its result is passed to R14.
 */
function evaluateDeviceRules({ payer_id, device_id, payee_id }) {
  const r13 = R13_newDeviceDetected(payer_id, device_id);
  const r14 = R14_newDeviceAndNewPayee(payer_id, device_id, payee_id, r13.triggered);
  const r15 = R15_deviceSharedAcrossPayers(device_id, payer_id);

  return [r13, r14, r15];
}

module.exports = { evaluateDeviceRules };