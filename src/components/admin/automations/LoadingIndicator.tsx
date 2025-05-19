
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex justify-center p-8">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 mt-2">{message}</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
