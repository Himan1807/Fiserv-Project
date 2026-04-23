import React from 'react';
import { RiskBadge } from './RiskBadge';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

export const TransactionTable = ({ transactions, onViewDetails }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase font-semibold text-xs sticky top-0">
            <tr>
              <th className="px-6 py-4">Txn ID</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Payer / Payee</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Risk Score</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((txn, index) => {
              // Apply row background highlighting based on risk level
              let rowClass = "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group";
              if (txn.risk_level === "HIGH") {
                rowClass += " bg-red-50/50 dark:bg-red-900/10";
              } else if (txn.risk_level === "MEDIUM") {
                rowClass += " bg-yellow-50/50 dark:bg-yellow-900/10";
              } else {
                rowClass += " bg-green-50/30 dark:bg-green-900/10";
              }

              return (
                <tr key={txn.transaction_id} className={`animate-in fade-in slide-in-from-top-2 duration-500 ${rowClass}`}>
                  <td className="px-6 py-4 font-mono text-xs">{txn.transaction_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(txn.timestamp), 'MMM dd, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{txn.payer_id}</span>
                      <span className="text-xs text-gray-400">to {txn.payee_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                    ₹{txn.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{txn.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            txn.risk_level === 'HIGH' ? 'bg-red-500' : 
                            txn.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${txn.risk_score}%` }}
                        ></div>
                      </div>
                      <span className="font-medium w-6 text-right">{txn.risk_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={txn.risk_level} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onViewDetails(txn)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
