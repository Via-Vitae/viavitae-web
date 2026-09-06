'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Accessible tooltip: the description is exposed via aria-describedby and shown on
// both hover and keyboard focus, so it is available without a pointer (WCAG 1.4.13).
// The trigger must be focusable; the tooltip itself is not interactive.

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        hidden={!visible}
        className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-xs -translate-x-1/2 rounded-sm bg-surface-inverse px-2 py-1 text-body-sm text-text-inverse shadow-md"
      >
        {label}
      </span>
    </span>
  );
}
