export const exportToCSV = (transactions, filename = "high_risk_transactions.csv") => {
  if (transactions.length === 0) return;

  const headers = [
    "Transaction ID",
    "Payer ID",
    "Payee ID",
    "Amount",
    "Timestamp",
    "Location",
    "Device ID",
    "Risk Score",
    "Risk Level",
    "Reasons"
  ];

  const csvRows = [
    headers.join(","),
    ...transactions.map(t => [
      t.transaction_id,
      t.payer_id,
      t.payee_id,
      t.amount,
      t.timestamp,
      t.location,
      t.device_id,
      t.risk_score,
      t.risk_level,
      `"${t.reasons.join(", ")}"` // Quotes for array elements
    ].join(","))
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
