import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'text-foreground',
      red: 'border-red-200 bg-red-100 text-red-800',
      orange: 'border-orange-200 bg-orange-100 text-orange-800',
      yellow: 'border-yellow-200 bg-yellow-100 text-yellow-800',
      green: 'border-green-200 bg-green-100 text-green-800',
      blue: 'border-blue-200 bg-blue-100 text-blue-800',
      slate: 'border-slate-200 bg-slate-100 text-slate-700',
    },
  },
  defaultVariants: { variant: 'default' },
});
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
