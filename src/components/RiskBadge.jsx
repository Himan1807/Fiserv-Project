import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const RiskBadge = ({ level, className }) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border";
  
  let colorClasses = "";
  if (level === "HIGH") {
    colorClasses = "bg-red-100 text-red-800 border-red-200";
  } else if (level === "MEDIUM") {
    colorClasses = "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else {
    colorClasses = "bg-green-100 text-green-800 border-green-200";
  }

  return (
    <span className={twMerge(clsx(baseClasses, colorClasses, className))}>
      {level}
    </span>
  );
};
