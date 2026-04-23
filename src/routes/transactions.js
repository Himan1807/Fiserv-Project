const express = require('express');

const { evaluateTransaction } = require('../services/evaluateTransaction');
const {
  getFlaggedTransactions,
  getRecentEvaluated,
  getMetrics,
} = require('../store/inMemoryRiskStore');
const { generateCSV } = require('../utils/csvExporter');

const router = express.Router();

router.post('/evaluate', (req, res) => {
  try {
    const result = evaluateTransaction(req.body || {});
    res.status(200).json({
      success: true,
      message: 'Transaction evaluated successfully',
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/flagged', (req, res) => {
  res.json({
    success: true,
    count: getFlaggedTransactions().length,
    data: getFlaggedTransactions(),
  });
});

router.get('/recent', (req, res) => {
  const limit = Number(req.query.limit);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;

  res.json({
    success: true,
    count: safeLimit,
    data: getRecentEvaluated(safeLimit),
  });
});

router.get(['/metrics', '/'], (req, res) => {
  res.json({
    success: true,
    data: getMetrics(),
  });
});

router.get(['/csv', '/csv/download', '/'], (req, res, next) => {
  const baseUrl = req.baseUrl || '';

  if (baseUrl.includes('/api/metrics')) {
    return next();
  }

  const flagged = getFlaggedTransactions();
  const csv = generateCSV(flagged);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="flagged-transactions.csv"');
  res.status(200).send(csv);
});

module.exports = router;
