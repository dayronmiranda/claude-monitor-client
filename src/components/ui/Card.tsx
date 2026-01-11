import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-4', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p
      className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-4 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div className={cn('flex items-center p-4 pt-0', className)} {...props} />
  )
}
