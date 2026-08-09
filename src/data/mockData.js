const DEMO_PROFILES = [
  { payer_id: '9988776655', device_id: 'DEVICE-DEL-001', location: 'Delhi' },
  { payer_id: '9988776650', device_id: 'DEVICE-MUM-002', location: 'Mumbai' },
  { payer_id: '9988776622', device_id: 'DEVICE-BLR-003', location: 'Bengaluru' },
  { payer_id: '9988776688', device_id: 'DEVICE-CHE-004', location: 'Chennai' },
];

const PAYEES = [
  'grocer@upi',
  'fuel@paytm',
  'utility@oksbi',
  'merchant@okaxis',
  'delivery@okhdfcbank',
];

const AMOUNTS = [250, 700, 5000, 9500, 10000, 55000];

let sequence = 0;

/**
 * Produces a raw transaction for the demo stream. The backend is the only
 * component that calculates a score, risk level, and reason codes.
 */
export function generateDemoTransaction() {
  const profile = DEMO_PROFILES[sequence % DEMO_PROFILES.length];
  const payee = PAYEES[sequence % PAYEES.length];
  const amount = AMOUNTS[sequence % AMOUNTS.length];
  const useSharedDevice = sequence > 0 && sequence % 11 === 0;

  sequence += 1;

  return {
    payer_id: profile.payer_id,
    payee_id: payee,
    amount,
    timestamp: new Date().toISOString(),
    location: profile.location,
    device_id: useSharedDevice ? 'DEVICE-SHARED-DEMO' : profile.device_id,
  };
}
