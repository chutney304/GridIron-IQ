import React from 'react';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`border rounded px-2 py-1 text-sm ${className}`} {...props} />;
}
