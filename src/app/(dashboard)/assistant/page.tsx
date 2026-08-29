'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, User, Sparkles, Send, Loader2, ArrowRight, ShieldCheck, HelpCircle, Layers, CheckCircle, Target, Calendar, Activity, BookOpen, Clock } from 'lucide-react'
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

const FEATURE_PROMPTS = [
  {
    icon: Sparkles,
    badge: 'Recommended',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    title: 'Generate Daily Plan',
    desc: 'Propose an optimized study & focus schedule based on your active sprint.',
    prompt: 'Generate an optimized daily plan for today based on my active sprint and priorities.'
  },
  {
    icon: Activity,
    badge: 'Simulation',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    title: 'Simulate Completion Deadline',
    desc: 'Forecast exam readiness and milestone completion dates.',
    prompt: 'Simulate: Can I finish SC-500 Exam Prep before August 21st?'
  },
  {
    icon: Target,
    badge: 'Capacity',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    title: 'Workload & Capacity Analysis',
    desc: 'Inspect current focus hours, health zone status, and capacity risks.',
    prompt: 'Analyze my workload health and capacity risks for this week.'
  },
  {
    icon: BookOpen,
    badge: 'Academic',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    title: 'Academic Timetable & Modules',
    desc: 'Summarize upcoming university lectures and module deadlines.',
    prompt: 'Summarize my academic timetable and module priorities for today and tomorrow.'
  }
]

const QUICK_ACTIONS = [
  { label: '🏖️ Propose 7-Day Sprint Plan', prompt: 'Propose daily plan using 7-Day Leave Sprint strategy' },
  { label: '⚡ Check Weekly Capacity', prompt: 'Generate weekly capacity review summary' },
  { label: '📌 Add Critical Task', prompt: 'Add Task: SC-500 Practice Test, High Priority' },
  { label: '📜 Add Certification', prompt: 'Add Certification: AWS Cloud Practitioner, 30 hours' },
  { label: '🎓 Check Campus Lectures', prompt: 'What are my university lectures for today?' },
  { label: '⏱️ Log Study Session', prompt: 'Log study session: SC-500 Prep, 180 minutes, COMPLETED' }
]

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

  const handleSend = async (e: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault()
    const textToSend = (customPrompt || input).trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: textToSend
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await askAssistant(textToSend)
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
          content: `Failed to process query: ${res.error || 'Server error.'}`
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
      
      {/* Decorative Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 relative z-10 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xs">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Life OS AI Assistant</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Autonomous Execution Engine</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
          >
            Clear Conversation
          </button>
        )}
      </div>
      
      {/* Main Chat / Hero Workspace Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin relative z-10">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto space-y-8 py-6 animate-in fade-in duration-500">
            
            {/* HERO TITLE BLOCK */}
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 shadow-xs mb-1">
                <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">How can I assist your workflow today?</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Select a structured action card below or type any custom request to simulate deadlines, manage tasks, or generate daily plans.
              </p>
            </div>

            {/* FEATURED PROMPT CARDS (2x2 GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_PROMPTS.map((card, idx) => {
                const CardIcon = card.icon
                return (
                  <button
                    key={idx}
                    onClick={(e) => handleSend(e, card.prompt)}
                    className="text-left p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group space-y-2 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-xl border ${card.color}`}>
                        <CardIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                        {card.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* QUICK SHORTCUT PILLS */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center">
                Quick Command Shortcuts
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSend(e, action.prompt)}
                    className="text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-100 dark:text-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 transition-all cursor-pointer shadow-2xs"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* CHAT MESSAGES */}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 group ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${m.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'}`}>
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            <div className={`rounded-2xl p-5 text-sm max-w-[85%] leading-relaxed border ${
              m.role === 'user'
                ? 'bg-slate-900 text-white border-slate-950 rounded-tr-sm'
                : 'bg-white border-slate-200 text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 rounded-tl-sm shadow-xs'
            }`}>
              <p className="whitespace-pre-wrap font-medium">{m.content}</p>

              {/* CITATIONS */}
              {m.role === 'assistant' && (m.citations?.length || 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-wrap gap-2 items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>References:</span>
                  {m.citations?.map((c, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded border dark:border-slate-700">{c}</span>
                  ))}
                </div>
              )}

              {/* ROUTING TOOLS */}
              {m.role === 'assistant' && (m.toolCalls?.length || 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Routing Tools:</span>
                  {m.toolCalls?.map((t, idx) => (
                    <span key={idx} className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">{t}</span>
                  ))}
                </div>
              )}

              {/* SUGGESTION PILLS */}
              {m.role === 'assistant' && (m.suggestions?.length || 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {m.suggestions?.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleSend(e, s)}
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
          <div className="flex gap-4 max-w-4xl mx-auto animate-in fade-in duration-200">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-4 max-w-[80%] flex items-center h-[50px]">
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
      
      {/* Input Form Bar */}
      <div className="p-4 md:p-6 relative z-10 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={(e) => handleSend(e)} className="mx-auto max-w-4xl flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-300">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to generate a plan, analyze workload, or simulate exam deadlines..." 
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500 font-bold px-3 text-xs"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
