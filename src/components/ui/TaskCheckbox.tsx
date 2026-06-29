'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { toggleTaskStatus } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'

interface TaskCheckboxProps {
  taskId: string
  title: string
  status: string
  className?: string
  textClassName?: string
}

export function TaskCheckbox({
  taskId,
  title,
  status,
  className,
  textClassName
}: TaskCheckboxProps) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = status === 'COMPLETED'

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleTaskStatus(taskId, status)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-3 text-left group w-full py-1.5 transition-opacity disabled:opacity-60 cursor-pointer",
        className
      )}
    >
      <div
        className={cn(
          "h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0",
          isCompleted
            ? "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-blue-500 dark:group-hover:border-blue-400"
        )}
      >
        {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
      </div>
      <span
        className={cn(
          "text-sm transition-all duration-200 line-clamp-1",
          isCompleted
            ? "line-through text-slate-400 dark:text-slate-500 font-medium"
            : "text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white",
          textClassName
        )}
      >
        {title}
      </span>
    </button>
  )
}
