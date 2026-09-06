import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Surface container built on brand tokens (raised surface + hairline border).
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation for clickable cards. */
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface-raised p-(--vv-card-padding,1.5rem)',
        'shadow-[0_1px_2px_rgba(14,27,61,0.06)]',
        interactive &&
          'transition-shadow motion-reduce:transition-none hover:shadow-[0_8px_24px_rgba(14,27,61,0.12)]',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex flex-col gap-1', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-heading-4 text-text-primary', className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-body-md text-text-secondary', className)} {...rest} />;
}
