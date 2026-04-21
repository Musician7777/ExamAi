'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

/**
 * Reusable empty state component for dashboard sections
 * 
 * @example
 * <EmptyState
 *   emoji='📝'
 *   title='No exams yet'
 *   description='Create your first exam to start practicing'
 *   action={{
 *     label: 'Create Exam',
 *     href: '/dashboard/generate'
 *   }}
 * />
 */
export default function EmptyState({
  emoji = '📭',
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Emoji with subtle animation */}
      <div className='relative mb-6'>
        <span className='text-5xl animate-bounce' style={{ animationDuration: '3s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }}>{emoji}</span>
        {/* Decorative ring */}
        <div className='absolute -inset-4 rounded-full border-2 border-dashed border-muted-foreground/20 -z-10' />
      </div>

      {/* Title */}
      <h3 className='text-lg font-semibold text-foreground mb-2'>{title}</h3>

      {/* Description */}
      {description && (
        <p className='text-sm text-muted-foreground max-w-sm mb-6'>{description}</p>
      )}

      {/* Action button */}
      {action && (
        action.href ? (
          <Button asChild className='gap-2'>
            <a href={action.href}>
              {action.label}
              {action.icon !== false && <ArrowRight className='h-4 w-4' />}
            </a>
          </Button>
        ) : (
          <Button onClick={action.onClick} className='gap-2'>
            {action.label}
            {action.icon !== false && <ArrowRight className='h-4 w-4' />}
          </Button>
        )
      )}

      {/* Keyboard shortcut hint for actionable empty states */}
      {action?.shortcut && (
        <p className='text-xs text-muted-foreground mt-4 flex items-center gap-1.5'>
          <kbd className='px-1.5 py-0.5 rounded bg-secondary text-xs font-mono'>{action.shortcut}</kbd>
          <span>to {action.shortcutHint || 'get started'}</span>
        </p>
      )}
    </div>
  );
}