import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { DashboardCharts } from './components/DashboardCharts';
import { TransactionTable } from './components/TransactionTable';
import { TransactionModal } from './components/TransactionModal';
import { MOCK_TRANSACTIONS, generateRandomTransaction } from './data/mockData';
import { exportToCSV } from './utils/export';
import { Search, Filter, Download, AlertTriangle, X } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newTxn = generateRandomTransaction();
      
      setTransactions(prev => [newTxn, ...prev].slice(0, 100)); // Keep last 100
      
      // Trigger alert for HIGH risk
      if (newTxn.risk_level === 'HIGH') {
        setToastAlert({
          id: Date.now(),
          message: `🚨 Fraud Alert! High-risk transaction detected: ${newTxn.transaction_id}`,
          amount: newTxn.amount
        });
        
        // Auto dismiss toast after 5s
        setTimeout(() => setToastAlert(null), 5000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Filter and Search logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Risk Filter
      if (filterLevel !== 'ALL' && txn.risk_level !== filterLevel) return false;
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          txn.payer_id.toLowerCase().includes(query) ||
          txn.payee_id.toLowerCase().includes(query) ||
          txn.transaction_id.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [transactions, searchQuery, filterLevel]);

  const handleExport = useCallback(() => {
    const highRiskTxns = transactions.filter(t => t.risk_level === 'HIGH');
    exportToCSV(highRiskTxns);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <SummaryCards transactions={transactions} />
        
        <DashboardCharts transactions={transactions} />

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, Payer, Payee..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none cursor-pointer"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="ALL">All Risks</option>
                <option value="HIGH">High Risk Only</option>
                <option value="MEDIUM">Medium Risk Only</option>
                <option value="LOW">Low Risk Only</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export High Risk (CSV)
          </button>
        </div>

        <TransactionTable 
          transactions={filteredTransactions} 
          onViewDetails={setSelectedTransaction}
        />

      </main>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}

      {/* Toast Notification */}
      {toastAlert && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg border border-red-500 flex items-start gap-4 max-w-sm">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{toastAlert.message}</p>
              <p className="text-red-100 text-sm mt-1">Amount: ₹{toastAlert.amount.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => setToastAlert(null)}
              className="text-red-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
