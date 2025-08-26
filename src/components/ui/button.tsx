import React from 'react';

type Variant = 'default' | 'outline' | 'ghost';

export function Button({ variant = 'default', className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'px-3 py-1 rounded text-sm';
  let style = '';
  if (variant === 'outline') style = 'border';
  else if (variant === 'ghost') style = 'bg-transparent';
  else style = 'bg-blue-600 text-white';
  const disabled = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  return (
    <button className={`${base} ${style} ${disabled} ${className}`} {...props}>
      {children}
    </button>
  );
}
