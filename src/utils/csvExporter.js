/**
 * LAYER: Export
 * Converts flagged transactions to CSV format for download.
 */

/**
 * Manually build CSV to avoid dependency issues.
 * Handles commas and quotes in field values safely.
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of scored transaction results into a CSV string.
 *
 * @param {Array} flaggedTransactions - Array of result objects from evaluateTransaction
 * @returns {string} CSV content
 */
function generateCSV(flaggedTransactions) {
  const headers = [
    'ID',
    'Payer ID',
    'Payee ID',
    'Amount (INR)',
    'Location',
    'Device ID',
    'Transaction Timestamp',
    'Final Score',
    'Risk Level',
    'Reason Codes',
    'Triggered Rules Count',
    'Processed At',
  ];

  const rows = flaggedTransactions.map(result => {
    const tx = result.transaction;
    return [
      result.id,
      tx.payer_id,
      tx.payee_id,
      tx.amount,
      tx.location,
      tx.device_id,
      tx.timestamp,
      result.finalScore,
      result.riskLevel,
      result.reasonCodes.join(' | '),
      result.triggeredRules.length,
      result.processedAt,
    ].map(escapeCSV).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

module.exports = { generateCSV };