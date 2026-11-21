import React from 'react';

export default function ProgressBar({ value = 0, max = 1 }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
