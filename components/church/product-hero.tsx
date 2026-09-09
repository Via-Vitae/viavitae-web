import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Apple-style product hero. Pure CSS/SVG presentation (no JS scroll listeners) so
// it stays within Core Web Vitals budgets; motion is gated behind motion-safe so a
// reduced-motion preference gets a static variant automatically.
export interface ProductHeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  /** Optional call-to-action slot rendered below the copy. */
  children?: ReactNode;
  className?: string;
}

export function ProductHero({ eyebrow, title, subtitle, children, className }: ProductHeroProps) {
  return (
    <section className={cn("relative overflow-hidden bg-navy-900 text-ivory-100", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 motion-safe:animate-[vv-hero-drift_18s_ease-in-out_infinite_alternate]"
        style={{
          background:
            "radial-gradient(60rem 30rem at 20% 10%, var(--vv-color-gold-500), transparent 60%), radial-gradient(50rem 30rem at 90% 80%, var(--vv-color-navy-500), transparent 55%)",
        }}
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-24 md:py-32">
        {eyebrow ? (
          <p className="text-body-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-fluid-display-xl text-ivory-100">{title}</h1>
        <p className="max-w-2xl text-body-lg text-navy-200">{subtitle}</p>
        {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
