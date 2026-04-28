'use client';
import { useRouter } from 'next/navigation';
import { getTaskAction } from '@/lib/pathwayEngine';

/**
 * TaskRouter — handles routing from a pathway task to the correct app feature.
 * Sets up sessionStorage with the right config and navigates.
 */
export function useTaskRouter() {
  const router = useRouter();

  function startTask(task) {
    if (!task || !task.actionRoute) return;

    const action = getTaskAction(task.type, task.subject, task.stage, task.metadata?.examName);

    if (action.mode === 'exam') {
      // Store exam config in sessionStorage for the generate page to pick up
      sessionStorage.setItem(
        'examConfigModalResult',
        JSON.stringify({
          mode: 'exam',
          config: {
            ...action.config,
            ...task.actionConfig,
          },
        })
      );
      router.push(action.route || '/dashboard/generate');
    } else if (action.mode === 'interview') {
      // Store interview config
      sessionStorage.setItem(
        'examConfigModalResult',
        JSON.stringify({
          mode: 'interview',
          config: {
            ...action.config,
            ...task.actionConfig,
          },
        })
      );
      router.push(action.route || '/dashboard/interview');
    } else if (action.mode === 'coding') {
      // Store coding config
      sessionStorage.setItem(
        'codingConfig',
        JSON.stringify({
          ...action.config,
          ...task.actionConfig,
        })
      );
      router.push(task.actionRoute || '/dashboard/coding');
    } else {
      // Fallback — just navigate
      router.push(task.actionRoute || '/dashboard');
    }
  }

  return { startTask };
}
