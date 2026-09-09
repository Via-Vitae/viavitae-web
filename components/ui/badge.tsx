import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { TierId } from "@/types/catalog";

// Small status/label pill. Tier badges (Economy / Normal / VIP) use distinct,
// colour-blind-safe treatments: the tier is also conveyed by its text label, never
// by colour alone (WCAG 1.4.1).

export type BadgeTone = "neutral" | "gold" | "navy" | "success" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-text-secondary border-border",
  gold: "bg-gold-100 text-text-primary border-gold-300",
  navy: "bg-navy-900 text-ivory-100 border-navy-900",
  success: "bg-state-success-tint text-text-primary border-state-success",
  info: "bg-state-info-tint text-text-primary border-state-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-body-sm font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Map a pricing tier to its badge tone. */
export const TIER_BADGE_TONE: Record<TierId, BadgeTone> = {
  economy: "neutral",
  normal: "info",
  vip: "gold",
};
