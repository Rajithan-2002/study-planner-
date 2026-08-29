'use client'

import { useState, useTransition } from 'react'
import { Activity, ShieldCheck, AlertCircle, Play, Undo2, Trash2, CheckCircle2, History, FileText, Loader2, Sparkles } from 'lucide-react'
import { approveAction, rollbackAction, deleteAutonomousAction } from '@/app/actions/autonomous'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { useToast } from '@/components/ui/Toast'

interface AutomationCenterViewProps {
  pendingActions: any[]
  historyActions: any[]
  executionLogs: any[]
}

export function AutomationCenterView({
  pendingActions = [],
  historyActions = [],
  executionLogs = []
}: AutomationCenterViewProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'templates' | 'logs'>('pending')
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Reusable confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    isDanger: boolean
    confirmText: string
    onConfirm: () => Promise<void> | void
    errorMsg: string | null
  }>({
    isOpen: false,
    title: '',
    description: '',
    isDanger: false,
    confirmText: 'Confirm',
    onConfirm: () => {},
    errorMsg: null
  })

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  // Action execution triggers
  const handleApprove = (actionId: string) => {
    startTransition(async () => {
      const res = await approveAction(actionId) as any
      if (res.success) {
        showSuccess('AI action approved and executed successfully!')
      } else {
        const errorMsg = res.error || (res.errors && res.errors.join(', ')) || 'Failed to execute proposed action.'
        toast(errorMsg, 'error')
      }
    })
  }

  const triggerRejectConfirm = (actionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Proposed Action',
      description: 'Are you sure you want to dismiss this AI proposal? This will remove the action block from the pending execution queue.',
      isDanger: true,
      confirmText: 'Reject Action',
      errorMsg: null,
      onConfirm: async () => {
        const res = await deleteAutonomousAction(actionId)
        if (res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          showSuccess('Proposed action dismissed.')
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res.error || 'Failed to reject' }))
        }
      }
    })
  }

  const triggerRollbackConfirm = (actionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Rollback Action Execution',
      description: 'Are you sure you want to rollback this action? This will undo all database mutations created during execution.',
      isDanger: true,
      confirmText: 'Rollback Changes',
      errorMsg: null,
      onConfirm: async () => {
        const res = await rollbackAction(actionId)
        if (res.success) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          showSuccess('Action execution rolled back successfully!')
        } else {
          setConfirmModal(prev => ({ ...prev, errorMsg: res.error || 'Failed to rollback' }))
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pending AI Proposals ({pendingActions.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Action History
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Workflow Templates
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Execution Logs
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. PENDING PROPOSALS TABS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingActions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20">
              <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No pending AI action proposals found.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Trigger actions by typing commands in the AI Assistant (e.g. "Create a cloud study project").</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingActions.map(action => (
                <div key={action.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded uppercase">
                        {action.action_type}
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 border border-amber-250 dark:border-amber-900/30 px-2 py-0.5 rounded">
                        Requires Confirmation
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {action.parameters.title || 'Untitled Action Project'}
                    </h4>
                    
                    {action.parameters.description && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {action.parameters.description}
                      </p>
                    )}

                    <span className="text-[10px] font-bold text-slate-400 block pt-1">
                      Proposed {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => triggerRejectConfirm(action.id)}
                      disabled={isPending}
                      className="h-10 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>

                    <Button
                      onClick={() => handleApprove(action.id)}
                      disabled={isPending}
                      className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      Approve & Execute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyActions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No completed actions logged in history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyActions.map(action => {
                const isCompleted = action.status === 'COMPLETED'
                const isRolledBack = action.status === 'ROLLED_BACK'
                return (
                  <div key={action.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-450 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                          {action.action_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isCompleted 
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' 
                            : isRolledBack 
                            ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/20'
                            : 'text-red-600 bg-red-50 dark:bg-red-950/20'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {action.parameters.title || 'Action Project'}
                      </h4>

                      <span className="text-[10px] font-bold text-slate-400 block">
                        Executed {new Date(action.executed_at || action.created_at).toLocaleString()}
                      </span>
                    </div>

                    {isCompleted && (
                      <Button
                        onClick={() => triggerRollbackConfirm(action.id)}
                        disabled={isPending}
                        variant="outline"
                        className="h-9 px-3 border border-purple-200 text-purple-600 dark:text-purple-400 dark:border-purple-900/30 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Rollback
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500 mb-3">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create Project Template</h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Creates a project board structured with 3 custom academic milestones and placeholder files for course outline tracking.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500 mb-3">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Timetable Block Scheduler</h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatically schedules flexible daily focus sessions corresponding to classes and critical deadline parameters.
            </p>
          </div>
        </div>
      )}

      {/* 4. EXECUTION LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {executionLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No execution logs found.</p>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {executionLogs.map(log => (
                <div key={log.id} className="bg-slate-950 text-slate-300 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between border-b border-slate-850 pb-2 mb-2 text-[10px] font-bold text-slate-500">
                    <span>LOG ID: {log.id}</span>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Step: {log.step_name}</span>
                    <span className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                      {log.status}
                    </span>
                  </div>
                  <div className="pt-1 text-slate-450">
                    <span>Duration: {log.duration_ms} ms</span>
                  </div>
                  {log.error_message && (
                    <div className="pt-2 text-red-400 text-[10px] whitespace-pre-wrap">
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER CONFIRMATION MODAL */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
        isLoading={isPending}
        errorMsg={confirmModal.errorMsg}
      />
    </div>
  )
}
