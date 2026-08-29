import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { AutomationCenterView } from '@/components/automation/AutomationCenterView'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
  const userId = await getCurrentUserId()
  const supabase = await createClient()

  // 1. Fetch pending actions
  const { data: pendingActions } = await supabase
    .from('ai_actions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['WAITING_CONFIRMATION', 'PROPOSED'])
    .order('created_at', { ascending: false })

  // 2. Fetch history actions
  const { data: historyActions } = await supabase
    .from('ai_actions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['COMPLETED', 'FAILED', 'ROLLED_BACK'])
    .order('created_at', { ascending: false })

  // 3. Fetch execution logs (scoped to this user's actions)
  const { data: executionLogs } = await supabase
    .from('action_execution_logs')
    .select('*, ai_actions!inner(user_id)')
    .eq('ai_actions.user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-650 dark:from-white dark:via-slate-200 dark:to-slate-450 bg-clip-text text-transparent">
          Automation Action Center
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Review, approve, or rollback autonomous decisions and workflows executed by your AI agent.
        </p>
      </div>

      <AutomationCenterView
        pendingActions={pendingActions || []}
        historyActions={historyActions || []}
        executionLogs={executionLogs || []}
      />
    </div>
  )
}
