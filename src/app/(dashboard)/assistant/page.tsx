'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, User, Sparkles, Send, Loader2, ArrowRight, ShieldCheck, HelpCircle, Layers, CheckCircle } from 'lucide-react'
import { askAssistant } from '@/app/actions/ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  toolCalls?: string[]
  suggestions?: string[]
  nextActions?: string[]
  confidence?: number
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    const promptText = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      const res = await askAssistant(promptText)
      if (res && res.success && res.response) {
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: res.response.answer,
          citations: res.response.citations,
          toolCalls: res.response.toolCalls,
          suggestions: res.response.suggestions,
          nextActions: res.response.nextActions,
          confidence: res.response.confidence
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `Failed to orchestrate query: ${res.error || 'Server error.'}`
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: `Error occurred: ${err.message}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex h-20 items-center border-b border-slate-200 dark:border-slate-800 px-8 relative z-10 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Life OS Agent</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Gateway Orchestration V6.2</p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[70%] text-center space-y-6 animate-in fade-in duration-500 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 shadow-md">
              <Bot className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">How can I help you today?</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                I am your intelligent planning gateway. Ask me to simulate completion deadlines, CRUD tasks, or rebalance schedules.
              </p>
            </div>

            {/* Expanded Quick Action Chips */}
            <div className="max-w-2xl w-full pt-4">
              <p className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 mb-3 tracking-wider">Quick Actions</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'Add Task', prompt: 'Add Task: Finish DSA, July 7, High Priority' },
                  { label: 'Add Project', prompt: 'Add Project: Build AI Portfolio, 120 hours, finish before October' },
                  { label: 'Add Certification', prompt: 'Add Certification: AWS SAA, 140 hours, exam in November' },
                  { label: 'Add Knowledge', prompt: 'Add Knowledge: Study notes for Cloud Security' },
                  { label: 'Quick Note', prompt: 'Quick Note: Remember to revise networking quiz before Friday' },
                  { label: 'Competition', prompt: 'Add Competition: HackX 2026, September 15' },
                  { label: 'Reminder', prompt: 'Add Reminder: Email supervisor on graduation project progress' },
                  { label: 'Study Session', prompt: 'Log study session: AWS SAA, 90 minutes, status: COMPLETED, notes: Finished IAM chapter' },
                  { label: 'Exam Result', prompt: 'Add Result: Semester 4, Cloud Computing, A-' },
                  { label: 'Module', prompt: 'Add Module: Database Design and Development, 3 credits, Year 1 Semester 2' },
                  { label: 'Memory', prompt: 'Retrieve memory: Career goals and focus preferences' },
                  { label: 'Reflection', prompt: 'Reflect on my study habits this week' },
                  { label: 'Goal', prompt: 'Add Goal: Become Cloud Security Engineer by graduation' },
                  { label: 'Idea', prompt: 'Add Idea: Decentralized file sharing app using IPFS' },
                  { label: 'Journal', prompt: 'Journal Entry: Feeling productive after completing the Cloud Computing lab' },
                  { label: 'Upload File', prompt: 'Upload new resource file: Lecture note pdf' },
                  { label: 'Generate Plan', prompt: 'Generate daily study plan for today' },
                  { label: 'Today\'s Plan', prompt: 'What should I do today?' },
                  { label: 'Weekly Review', prompt: 'Generate weekly review summary' },
                  { label: 'Search', prompt: 'Search notes: Distributed Systems' },
                  { label: 'Recommendations', prompt: 'Recommend my next action' },
                  { label: 'Recurring', prompt: 'Add Habit: Solve one LeetCode problem every day for 30 minutes' },
                  { label: 'Commitment', prompt: 'Add Commitment: Cloud Security Lecture on Monday 9am, 120 minutes' },
                  { label: 'Vacation', prompt: 'Add Vacation: Holiday from August 10 to August 18, capacity multiplier 0.0' },
                  { label: 'Simulation', prompt: 'Simulate: Can I finish AWS Solutions Architect before November 20th?' }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setInput(chip.prompt)}
                    className="text-xs font-bold text-slate-650 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100/80 dark:text-slate-300 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 group ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${m.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
              {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </div>
            
            <div className={`rounded-2xl p-5 text-sm max-w-[80%] leading-relaxed border ${
              m.role === 'user'
                ? 'bg-slate-900 text-white border-slate-950 rounded-tr-sm'
                : 'bg-white border-slate-200 text-slate-850 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200 rounded-tl-sm shadow-xs'
            }`}>
              <p className="whitespace-pre-wrap font-medium">{m.content}</p>

              {/* CITATIONS & TOOL METRICS */}
              {m.role === 'assistant' && (m.citations?.length || 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-850/80 flex flex-wrap gap-2 items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>References:</span>
                  {m.citations?.map((c, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded border dark:border-slate-700">{c}</span>
                  ))}
                </div>
              )}

              {/* AUTOMATED TOOL TRIGGERS SUMMARY */}
              {m.role === 'assistant' && (m.toolCalls?.length || 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Routing Tools:</span>
                  {m.toolCalls?.map((t, idx) => (
                    <span key={idx} className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">{t}</span>
                  ))}
                </div>
              )}

              {/* SUGGESTION PILLS */}
              {m.role === 'assistant' && (m.suggestions?.length || 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-850/80 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {m.suggestions?.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(s)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in duration-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-150 dark:bg-slate-950 dark:border-slate-850 p-5 max-w-[80%] flex items-center h-[54px]">
               <span className="flex space-x-1.5 items-center">
                 <span className="h-2 w-2 bg-indigo-500/60 rounded-full animate-bounce"></span>
                 <span className="h-2 w-2 bg-indigo-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                 <span className="h-2 w-2 bg-indigo-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
               </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      {/* Input Area */}
      <div className="p-6 relative z-10 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="mx-auto max-w-4xl flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-300">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to summarize a module, or analyze a project..." 
            className="flex-1 bg-transparent text-slate-850 placeholder-slate-500 focus:outline-none dark:text-white dark:placeholder-slate-400 font-bold px-3 text-xs"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <ArrowRight className="h-4.5 w-4.5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
