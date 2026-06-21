import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading EcoTrack...", 
  className = "min-h-screen" 
}) => {
  return (
    <div className={`${className} bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center font-semibold text-eco-600`}>
      <div className="w-12 h-12 border-4 border-eco-200 border-t-eco-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-600 dark:text-slate-300 animate-pulse text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
