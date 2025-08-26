import React from 'react';

type SelectProps = {
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Select({ value, onValueChange, className = '', children }: SelectProps) {
  let triggerClass = '';
  const options: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectTrigger) {
      triggerClass = child.props.className || '';
    } else if (child.type === SelectContent) {
      React.Children.forEach(child.props.children, (item) => {
        if (React.isValidElement(item) && item.type === SelectItem) {
          options.push(item);
        }
      });
    }
  });
  return (
    <select className={`${triggerClass} ${className}`} value={value} onChange={(e) => onValueChange(e.target.value)}>
      {options}
    </select>
  );
}

export function SelectTrigger({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}

export function SelectValue(_: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}
