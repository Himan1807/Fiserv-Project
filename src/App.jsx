import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AlertTriangle, Download, Filter, Search, X } from 'lucide-react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { DashboardCharts } from './components/DashboardCharts';
import { TransactionTable } from './components/TransactionTable';
import { TransactionModal } from './components/TransactionModal';
import { generateDemoTransaction } from './data/mockData';
import {
  downloadFlaggedTransactions,
  evaluateTransaction,
  getRecentTransactions,
  webSocketUrl,
} from './services/fraudApi';
import { toDashboardTransaction } from './utils/transactionMapper';

const MAX_DASHBOARD_TRANSACTIONS = 100;

function upsertTransaction(transactions, transaction) {
  return [
    transaction,
    ...transactions.filter(item => item.transaction_id !== transaction.transaction_id),
  ].slice(0, MAX_DASHBOARD_TRANSACTIONS);
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);
  const [serviceError, setServiceError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  const receiveScoredTransaction = useEffectEvent(result => {
    const transaction = toDashboardTransaction(result);

    setTransactions(current => upsertTransaction(current, transaction));

    if (transaction.risk_level === 'HIGH' || transaction.risk_level === 'CRITICAL') {
      setToastAlert({
        id: transaction.transaction_id,
        amount: transaction.amount,
        riskLevel: transaction.risk_level,
        message: `Fraud alert: ${transaction.risk_level.toLowerCase()}-risk transaction detected`,
      });
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      return;
    }

    document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    let active = true;

    getRecentTransactions()
      .then(results => {
        if (!active) return;

        setTransactions(results.map(toDashboardTransaction).slice(0, MAX_DASHBOARD_TRANSACTIONS));
      })
      .catch(error => {
        if (active) {
          setServiceError(`Unable to load transaction history: ${error.message}`);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let closedByApp = false;

    const connect = () => {
      try {
        socket = new WebSocket(webSocketUrl);
      } catch {
        setRealtimeStatus('offline');
        setServiceError('Unable to create a real-time connection to the fraud service.');
        return;
      }

      socket.onopen = () => {
        setRealtimeStatus('connected');
        setServiceError('');
      };

      socket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'transaction_scored') {
            receiveScoredTransaction(message.data);
          }
        } catch {
          setServiceError('Received an invalid real-time event from the fraud service.');
        }
      };

      socket.onclose = () => {
        if (closedByApp) return;

        setRealtimeStatus('reconnecting');
        reconnectTimer = window.setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        setRealtimeStatus('offline');
      };
    };

    connect();

    return () => {
      closedByApp = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    let requestInFlight = false;

    const submitDemoTransaction = async () => {
      if (requestInFlight) return;

      requestInFlight = true;
      try {
        const result = await evaluateTransaction(generateDemoTransaction());
        receiveScoredTransaction(result);
        setServiceError('');
      } catch (error) {
        setServiceError(`Unable to evaluate the demo transaction: ${error.message}`);
      } finally {
        requestInFlight = false;
      }
    };

    void submitDemoTransaction();
    const interval = window.setInterval(() => void submitDemoTransaction(), 2000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toastAlert) return undefined;

    const timer = window.setTimeout(() => setToastAlert(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastAlert]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterLevel !== 'ALL' && transaction.risk_level !== filterLevel) return false;

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        transaction.payer_id.toLowerCase().includes(query) ||
        transaction.payee_id.toLowerCase().includes(query) ||
        transaction.transaction_id.toLowerCase().includes(query)
      );
    });
  }, [filterLevel, searchQuery, transactions]);

  const handleExport = async () => {
    try {
      await downloadFlaggedTransactions();
    } catch (error) {
      setServiceError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-gray-900">
      <Header
        isDarkMode={isDarkMode}
        realtimeStatus={realtimeStatus}
        toggleDarkMode={() => setIsDarkMode(value => !value)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {serviceError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{serviceError}</p>
          </div>
        )}

        <SummaryCards transactions={transactions} />
        <DashboardCharts transactions={transactions} />

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, payer, or payee..."
                className="block w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-gray-900 transition-shadow placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-10 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                value={filterLevel}
                onChange={event => setFilterLevel(event.target.value)}
              >
                <option value="ALL">All Risks</option>
                <option value="CRITICAL">Critical Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Export Flagged CSV
          </button>
        </div>

        <TransactionTable transactions={filteredTransactions} onViewDetails={setSelectedTransaction} />
      </main>

      {selectedTransaction && (
        <TransactionModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      )}

      {toastAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="flex items-start gap-4 rounded-xl border border-red-500 bg-red-600 px-6 py-4 text-white shadow-lg">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold">{toastAlert.message}</p>
              <p className="mt-1 text-sm text-red-100">
                Amount: Rs. {toastAlert.amount.toLocaleString()} ({toastAlert.riskLevel})
              </p>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-red-200 transition-colors hover:text-white"
              aria-label="Dismiss alert"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
