import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    const inputClasses = `
      block w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
      ${error 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
      }
      ${icon ? 'pl-10' : ''}
      ${className}
    `;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center text-red-600 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}
        {hint && !error && (
          <p className="text-gray-500 text-xs">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;