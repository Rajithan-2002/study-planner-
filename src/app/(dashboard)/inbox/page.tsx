import { Inbox } from 'lucide-react'
import { getInboxItems } from '@/app/actions/quick-capture'
import { getDomains } from '@/app/actions/domains'
import { InboxView } from '@/components/dashboard/InboxView'

export default async function InboxPage() {
  const inboxItems = await getInboxItems()
  const domains = await getDomains()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-3">
          <Inbox className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          Universal Inbox
        </h2>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Process and organize your quick captures. Convert thoughts into structured tasks, projects, certs, or notes.
        </p>
      </div>

      {/* INBOX CLIENT VIEW */}
      <InboxView initialItems={inboxItems || []} domains={domains || []} />

    </div>
  )
}
