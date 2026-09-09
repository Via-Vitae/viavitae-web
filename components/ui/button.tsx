import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Button primitives. Variants map to the brand palette:
//   primary   -> gold (honourific CTA; gold-500 fails text contrast on light
//                surfaces, so text uses the on-gold token, per brand guidance)
//   secondary -> navy (structural)
//   ghost     -> transparent, borderless, for toolbars and menus
// Export buttonVariants() so the locale-aware <Link> can render as a button.

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-ui font-medium " +
  "transition-colors motion-reduce:transition-none disabled:pointer-events-none " +
  "disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold-500 text-text-on-gold hover:bg-gold-600 active:bg-gold-700",
  secondary: "bg-navy-900 text-ivory-100 hover:bg-navy-800 active:bg-navy-700",
  ghost: "bg-transparent text-text-primary hover:bg-surface-sunken active:bg-surface-sunken",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-body-sm",
  md: "px-4 py-2 text-body-md",
  lg: "px-6 py-3 text-body-lg",
};

export interface ButtonVariantsProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Class string for a button-styled element (used by <Link> CTAs). */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantsProps = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantsProps {}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...rest} />;
}
