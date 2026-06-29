'use client'

import { useRef, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createQuickTask } from '@/app/actions/tasks'

interface QuickAddTaskProps {
  relatedEntityType: 'PROJECT' | 'CERTIFICATION'
  relatedEntityId: string
  domainId?: string
}

export function QuickAddTask({
  relatedEntityType,
  relatedEntityId,
  domainId
}: QuickAddTaskProps) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleAction = async (formData: FormData) => {
    const title = formData.get('title') as string
    if (!title || !title.trim()) return

    startTransition(async () => {
      try {
        await createQuickTask(title.trim(), relatedEntityType, relatedEntityId, domainId)
        formRef.current?.reset()
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={handleAction}
      className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-950 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors"
    >
      <input
        required
        type="text"
        name="title"
        disabled={isPending}
        placeholder="Add a fast task..."
        className="flex-1 bg-transparent text-xs outline-none border-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending}
        className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
    </form>
  )
}
