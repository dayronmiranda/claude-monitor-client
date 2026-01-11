import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]':
            variant === 'default',
          'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]':
            variant === 'secondary',
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]':
            variant === 'destructive',
          'border border-[hsl(var(--border))] text-[hsl(var(--foreground))]':
            variant === 'outline',
          'bg-green-500/20 text-green-400': variant === 'success',
        },
        className
      )}
      {...props}
    />
  )
}
