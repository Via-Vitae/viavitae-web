'use client';

import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Accessible tabs (WAI-ARIA Tabs pattern): roving tabindex, Arrow/Home/End key
// navigation, aria-selected, and panels labelled by their tab.

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
}

export interface TabsProps {
  items: readonly TabItem[];
  className?: string;
  label: string;
}

export function Tabs({ items, className, label }: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index === last ? 0 : index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index === 0 ? last : index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(last);
        break;
      default:
        break;
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-border-divider">
        {items.map((item, index) => {
          const tabId = `${baseId}-${item.id}-tab`;
          const panelId = `${baseId}-${item.id}-panel`;
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'px-4 py-2 text-body-md font-medium transition-colors motion-reduce:transition-none',
                selected
                  ? 'border-b-2 border-gold-500 text-text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => {
        const tabId = `${baseId}-${item.id}-tab`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId}
            hidden={index !== active}
            tabIndex={0}
            className="py-4"
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}
