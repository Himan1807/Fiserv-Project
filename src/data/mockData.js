export const MOCK_TRANSACTIONS = [
  {
    transaction_id: "tx123",
    payer_id: "9988776655",
    payee_id: "MERCHANT121",
    amount: 9500,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    location: "Delhi",
    device_id: "ABC123",
    risk_score: 78,
    risk_level: "HIGH",
    reasons: ["HIGH_AMOUNT", "NEW_MERCHANT", "VELOCITY_SPIKE"],
  },
  {
    transaction_id: "tx124",
    payer_id: "9988776650",
    payee_id: "MERCHANT002",
    amount: 150,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    location: "Mumbai",
    device_id: "XYZ987",
    risk_score: 12,
    risk_level: "LOW",
    reasons: [],
  },
  {
    transaction_id: "tx125",
    payer_id: "9988776622",
    payee_id: "USER554",
    amount: 4500,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    location: "Bangalore",
    device_id: "LMN456",
    risk_score: 55,
    risk_level: "MEDIUM",
    reasons: ["DEVICE_CHANGE"],
  },
  {
    transaction_id: "tx126",
    payer_id: "9988776688",
    payee_id: "USER112",
    amount: 50,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    location: "Chennai",
    device_id: "QWE789",
    risk_score: 5,
    risk_level: "LOW",
    reasons: [],
  },
];

export const generateRandomTransaction = () => {
  const levels = ["LOW", "LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH"];
  const selectedLevel = levels[Math.floor(Math.random() * levels.length)];
  
  let risk_score = 0;
  let amount = 0;
  let reasons = [];

  if (selectedLevel === "HIGH") {
    risk_score = Math.floor(Math.random() * 21) + 80; // 80-100
    amount = Math.floor(Math.random() * 90000) + 10000;
    reasons = ["HIGH_AMOUNT", "VELOCITY_SPIKE", "UNUSUAL_LOCATION"];
  } else if (selectedLevel === "MEDIUM") {
    risk_score = Math.floor(Math.random() * 40) + 40; // 40-79
    amount = Math.floor(Math.random() * 9000) + 1000;
    reasons = ["NEW_MERCHANT", "DEVICE_CHANGE"];
  } else {
    risk_score = Math.floor(Math.random() * 40); // 0-39
    amount = Math.floor(Math.random() * 900) + 10;
    reasons = [];
  }

  const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad"];
  
  return {
    transaction_id: `tx${Math.floor(Math.random() * 100000)}`,
    payer_id: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    payee_id: `MERCHANT${Math.floor(Math.random() * 999)}`,
    amount,
    timestamp: new Date().toISOString(),
    location: cities[Math.floor(Math.random() * cities.length)],
    device_id: `DEV${Math.floor(Math.random() * 9999)}`,
    risk_score,
    risk_level: selectedLevel,
    reasons,
  };
};
