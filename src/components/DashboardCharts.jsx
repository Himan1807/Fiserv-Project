import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

export const DashboardCharts = ({ transactions }) => {
  // Process data for Line Chart (transactions over time - last 10 minutes, grouped by minute)
  const lineChartData = useMemo(() => {
    // A simple aggregation by minute for the line chart
    const counts = {};
    transactions.forEach(txn => {
      const timeStr = format(new Date(txn.timestamp), 'HH:mm');
      if (!counts[timeStr]) {
        counts[timeStr] = { time: timeStr, total: 0, highRisk: 0 };
      }
      counts[timeStr].total += 1;
      if (txn.risk_level === 'HIGH') {
        counts[timeStr].highRisk += 1;
      }
    });
    
    // Convert to array and sort by time
    return Object.values(counts).sort((a, b) => a.time.localeCompare(b.time)).slice(-10); // Show last 10 minutes
  }, [transactions]);

  // Process data for Pie Chart
  const pieChartData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    transactions.forEach(txn => counts[txn.risk_level]++);
    return [
      { name: 'High Risk', value: counts.HIGH, color: '#ef4444' }, // red-500
      { name: 'Medium Risk', value: counts.MEDIUM, color: '#facc15' }, // yellow-400
      { name: 'Low Risk', value: counts.LOW, color: '#22c55e' } // green-500
    ];
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transaction Volume</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={10} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="highRisk" name="High Risk" stroke="#ef4444" strokeWidth={2} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
