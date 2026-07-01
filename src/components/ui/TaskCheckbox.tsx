'use client'

import { useTransition } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { toggleTaskStatus, deleteTask } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'

interface TaskCheckboxProps {
  taskId: string
  title: string
  status: string
  className?: string
  textClassName?: string
  showDelete?: boolean
}

export function TaskCheckbox({
  taskId,
  title,
  status,
  className,
  textClassName,
  showDelete = true
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      try {
        await deleteTask(taskId)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <div className="group/item flex items-center justify-between w-full">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "flex items-center gap-3 text-left flex-1 min-w-0 py-1.5 transition-opacity disabled:opacity-60 cursor-pointer",
          className
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-md border flex items-center justify-center transition-all duration-200 shrink-0",
            isCompleted
              ? "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover/item:border-blue-500 dark:group-hover/item:border-blue-400"
          )}
        >
          {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
        <span
          className={cn(
            "text-sm transition-all duration-200 line-clamp-1",
            isCompleted
              ? "line-through text-slate-400 dark:text-slate-500 font-medium"
              : "text-slate-700 dark:text-slate-300 font-medium group-hover/item:text-slate-900 dark:group-hover/item:text-white",
            textClassName
          )}
        >
          {title}
        </span>
      </button>

      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer shrink-0 ml-2"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

