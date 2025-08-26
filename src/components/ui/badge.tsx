import React from 'react';

type Variant = 'default' | 'secondary' | 'outline';

export function Badge({ variant = 'default', className = '', children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  let style = 'px-2 py-0.5 text-xs rounded';
  if (variant === 'secondary') style += ' bg-gray-200 text-gray-800';
  else if (variant === 'outline') style += ' border';
  else style += ' bg-blue-600 text-white';
  return (
    <span className={`${style} ${className}`} {...props}>
      {children}
    </span>
  );
}
