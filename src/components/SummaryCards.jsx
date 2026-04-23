import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

export const SummaryCards = ({ transactions }) => {
  const total = transactions.length;
  const highRisk = transactions.filter(t => t.risk_level === "HIGH").length;
  const mediumRisk = transactions.filter(t => t.risk_level === "MEDIUM").length;
  const lowRisk = transactions.filter(t => t.risk_level === "LOW").length;

  const cards = [
    {
      title: "Total Transactions",
      value: total,
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      title: "High Risk",
      value: highRisk,
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/50"
    },
    {
      title: "Medium Risk",
      value: mediumRisk,
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/50"
    },
    {
      title: "Safe Transactions",
      value: lowRisk,
      icon: ShieldCheck,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {card.title}
              </p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {card.value.toLocaleString()}
              </h3>
            </div>
            <div className={`p-4 rounded-xl ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
