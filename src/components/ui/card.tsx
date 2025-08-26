import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border bg-white ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}
