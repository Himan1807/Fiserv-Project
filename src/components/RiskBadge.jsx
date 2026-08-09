import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const RiskBadge = ({ level, className }) => {
  const baseClasses = 'rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide';
  const colorClasses = {
    CRITICAL: 'border-rose-300 bg-rose-200 text-rose-950',
    HIGH: 'border-red-200 bg-red-100 text-red-800',
    MEDIUM: 'border-yellow-200 bg-yellow-100 text-yellow-800',
    LOW: 'border-green-200 bg-green-100 text-green-800',
  }[level] || 'border-gray-200 bg-gray-100 text-gray-800';

  return (
    <span className={twMerge(clsx(baseClasses, colorClasses, className))}>
      {level}
    </span>
  );
};
