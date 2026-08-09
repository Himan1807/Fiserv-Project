import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Smartphone, MapPin, DollarSign, Clock, Hash, CheckCircle2 } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { format } from 'date-fns';

export const TransactionModal = ({ transaction, onClose }) => {
  const modalRef = useRef(null);

  // Close on escape key or clicking outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-start ${
          transaction.risk_level === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' :
          transaction.risk_level === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30' :
          'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-700'
        }`}>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Transaction Details
              <RiskBadge level={transaction.risk_level} />
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <Hash className="w-4 h-4" /> {transaction.transaction_id}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Transaction Data */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Payment Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <span>Amount</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      ₹{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>Time</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-right">
                      {format(new Date(transaction.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {transaction.location}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Smartphone className="w-4 h-4" />
                      <span>Device ID</span>
                    </div>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {transaction.device_id}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Entities
                </h3>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payer</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.payer_id}</p>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 mx-4"></div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Payee</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.payee_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Risk Analysis */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Risk Analysis
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col h-[calc(100%-2rem)]">
                
                {/* Score */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-2 shadow-inner"
                    style={{
                      borderColor: transaction.risk_level === 'HIGH' ? '#ef4444' : transaction.risk_level === 'MEDIUM' ? '#facc15' : '#22c55e',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {transaction.risk_score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Risk Score (0-100)</p>
                </div>

                {/* Reasons */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Risk Factors</p>
                  {transaction.reasons.length > 0 ? (
                    <ul className="space-y-3">
                      {transaction.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className={`w-5 h-5 shrink-0 ${
                            transaction.risk_level === 'HIGH' ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                          <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {reason.replace(/_/g, ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">No suspicious factors detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          {transaction.risk_level === 'HIGH' && (
            <button className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">
              Block Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
