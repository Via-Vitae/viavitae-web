"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Accessible accordion for FAQ blocks (WAI-ARIA Accordion pattern).
// Each header is a real <button> with aria-expanded/aria-controls; the panel is a
// region labelled by its header. Multiple panels may be open independently.

export interface AccordionItem {
  id?: string;
  question: string;
  answer: ReactNode;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  className?: string;
  /** Accessible name for the accordion group (defaults to a translated heading). */
  labelledBy?: string;
}

export function Accordion({ items, className, labelledBy }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={cn("divide-y divide-border-divider border-y border-border-divider", className)}
      aria-labelledby={labelledBy}
    >
      {items.map((item, idx) => {
        const id = item.id ?? `item-${idx}`;
        const buttonId = `${baseId}-${id}-button`;
        const panelId = `${baseId}-${id}-panel`;
        const expanded = open.has(id);
        return (
          <div key={id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-body-lg font-medium text-text-primary hover:text-text-brand"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 transition-transform motion-reduce:transition-none",
                    expanded && "rotate-180",
                  )}
                >
                  &#9662;
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="pb-4 text-body-md text-text-secondary"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
