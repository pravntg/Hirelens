import React from 'react';

interface ScoreGaugeProps {
  score: number; // 1-10 scale
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', showLabel = true }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((score / 10) * 100)));

  // Crisp high contrast color scheme
  let strokeColor = '#10B981'; // Emerald
  let textColor = 'text-emerald-700';
  let subTextColor = 'text-emerald-800/80';
  let badgeBg = 'bg-emerald-50 border-emerald-300 text-emerald-700';
  let badgeText = 'Strong Match';
  let trackColor = '#E2E8F0';

  if (score < 5) {
    strokeColor = '#F43F5E'; // Rose
    textColor = 'text-rose-700';
    subTextColor = 'text-rose-800/80';
    badgeBg = 'bg-rose-50 border-rose-300 text-rose-700';
    badgeText = 'Low Match';
  } else if (score < 7) {
    strokeColor = '#F59E0B'; // Amber
    textColor = 'text-amber-700';
    subTextColor = 'text-amber-800/80';
    badgeBg = 'bg-amber-50 border-amber-300 text-amber-700';
    badgeText = 'Under Review';
  }

  const dimensions = {
    sm: { circleSize: 64, strokeWidth: 6, percentageSize: 'text-sm font-black', scoreSize: 'text-[9px] font-bold', radius: 25 },
    md: { circleSize: 96, strokeWidth: 8, percentageSize: 'text-xl font-black', scoreSize: 'text-[11px] font-bold', radius: 38 },
    lg: { circleSize: 124, strokeWidth: 10, percentageSize: 'text-3xl font-black', scoreSize: 'text-xs font-extrabold', radius: 50 }
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center rounded-full bg-white border border-slate-200 p-1.5 shadow-md">
        <svg
          width={dimensions.circleSize}
          height={dimensions.circleSize}
          className="transform -rotate-90"
        >
          {/* Background Track Circle */}
          <circle
            cx={dimensions.circleSize / 2}
            cy={dimensions.circleSize / 2}
            r={dimensions.radius}
            stroke={trackColor}
            strokeWidth={dimensions.strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx={dimensions.circleSize / 2}
            cy={dimensions.circleSize / 2}
            r={dimensions.radius}
            stroke={strokeColor}
            strokeWidth={dimensions.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Crisp Center Text */}
        <div className={`absolute flex flex-col items-center justify-center leading-none text-center pointer-events-none`}>
          <span className={`${dimensions.percentageSize} ${textColor} tracking-tight`}>
            {percentage}%
          </span>
          <span className={`${dimensions.scoreSize} ${subTextColor} mt-0.5`}>
            {score}/10
          </span>
        </div>
      </div>

      {showLabel && (
        <span className={`mt-2 text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${badgeBg} shadow-xs`}>
          {badgeText}
        </span>
      )}
    </div>
  );
};
