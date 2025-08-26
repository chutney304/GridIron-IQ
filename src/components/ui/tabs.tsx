import React, { createContext, useContext, useState } from 'react';

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = createContext<TabsCtx | undefined>(undefined);

export function Tabs({ defaultValue, children, className = '' }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className={className}>
      <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>
    </div>
  );
}

export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;
  return (
    <button
      className={`${className} ${active ? 'font-bold' : ''}`}
      onClick={() => ctx.setValue(value)}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
