'use client'

import { Bot, Paperclip, Send, User, Sparkles, Calendar, Check, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react'
import { createTaskDirect } from '@/app/actions/tasks'
import { createLifeEventDirect } from '@/app/actions/life-events'

interface ActionCardProps {
  name: string
  params: any
  messageId: string
  index: number
}

function ActionCard({ name, params, messageId, index }: ActionCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleExecute = async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      if (name === 'create_task') {
        const title = params.title || params.task || 'New Task'
        const description = params.description || ''
        const priority = params.priority || 'MEDIUM'
        const due_date = params.due_date || params.date || undefined

        await createTaskDirect({ title, description, priority, due_date })
      } else if (name === 'create_life_event') {
        const title = params.title || params.event || 'New Life Event'
        const type = params.type || 'ASSIGNMENT'
        const event_date = params.event_date || params.date || new Date().toISOString().split('T')[0]
        const importance = params.importance || 50

        await createLifeEventDirect({ title, type, event_date, importance })
      } else {
        throw new Error(`Unsupported action: ${name}`)
      }
      setStatus('success')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Failed to complete action')
      setStatus('error')
    }
  }

  const isTask = name === 'create_task'
  const title = params.title || params.task || params.event || 'Untitled Suggestion'
  
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-5 shadow-md backdrop-blur-sm dark:border-indigo-500/10 dark:from-indigo-950/30 dark:to-purple-950/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 w-full">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase shadow-sm ${
              isTask 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' 
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
            }`}>
              {isTask ? 'Suggested Task' : 'Suggested Event'}
            </span>
            {params.priority && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                params.priority === 'CRITICAL' || params.priority === 'HIGH'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : params.priority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {params.priority}
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
            {title}
          </h4>
          {params.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {params.description}
            </p>
          )}
          {(params.due_date || params.event_date || params.date) && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Date: {params.due_date || params.event_date || params.date}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {status === 'success' ? (
            <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 px-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-inner border border-emerald-500/20 animate-in zoom-in-95 duration-200">
              <Check className="h-4 w-4" />
              <span>Added to Life OS</span>
            </div>
          ) : (
            <button
              onClick={handleExecute}
              disabled={status === 'loading'}
              className={`flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none ${
                status === 'error'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Life OS</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {status === 'error' && errorMsg && (
        <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  )
}

interface ParsedPart {
  type: 'text' | 'action'
  text?: string
  action?: {
    name: string
    params: any
    raw: string
  }
}

function parseMessageText(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  const regex = /<function=(\w+)>([\s\S]*?)<\/function>/g
  
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index
    
    // Add text before the match
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        text: text.substring(lastIndex, matchIndex)
      })
    }
    
    const actionName = match[1]
    const rawParams = match[2]
    let params = {}
    try {
      params = JSON.parse(rawParams)
    } catch (e) {
      try {
        const repaired = rawParams
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
        params = JSON.parse(repaired)
      } catch (innerError) {
        console.error('Failed to parse tag JSON params:', rawParams)
        const titleMatch = rawParams.match(/"(?:title|task|event)"\s*:\s*"(.*?)"/)
        if (titleMatch) {
          params = { title: titleMatch[1] }
        }
      }
    }
    
    parts.push({
      type: 'action',
      action: {
        name: actionName,
        params,
        raw: match[0]
      }
    })
    
    lastIndex = regex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    // Check if there is an unclosed tag starting to stream
    const unclosedIndex = remainingText.indexOf('<function=')
    if (unclosedIndex !== -1) {
      if (unclosedIndex > 0) {
        parts.push({
          type: 'text',
          text: remainingText.substring(0, unclosedIndex)
        })
      }
    } else {
      parts.push({
        type: 'text',
        text: remainingText
      })
    }
  }
  
  return parts
}

export default function AssistantPage() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status } = useChat()
  const isLoading = status === 'submitted' || status === 'streaming'
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const textToSend = input
    setInput('')
    try {
      await sendMessage({ text: textToSend })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col rounded-3xl border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 ease-out relative">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex h-20 items-center border-b border-white/20 dark:border-white/5 px-8 relative z-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Life OS Intelligence</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Powered by Groq LLama 3.3</p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-in fade-in zoom-in duration-700 delay-150 fill-mode-forwards">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border border-white/50 dark:border-white/10 shadow-xl">
              <Bot className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">How can I help you today?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                I can help organize your study plan, review your projects, or analyze any documents you upload.
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 group ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${m.role === 'user' ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
              {m.role === 'user' ? (
                <User className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>
            <div className={`rounded-2xl p-5 text-sm md:text-base max-w-[85%] leading-relaxed shadow-sm backdrop-blur-sm ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-sm' 
                : 'bg-white/80 border border-white/40 text-slate-800 dark:bg-slate-800/80 dark:border-white/5 dark:text-slate-100 rounded-tl-sm'
            }`}>
              <div className="space-y-2">
                {m.parts.map((part, index) => {
                  if (part.type === 'text') {
                    const parsedParts = parseMessageText(part.text)
                    return (
                      <div key={index} className="space-y-2">
                        {parsedParts.map((subPart, subIndex) => {
                          if (subPart.type === 'text') {
                            return (
                              <p key={subIndex} className="whitespace-pre-wrap">
                                {subPart.text}
                              </p>
                            )
                          }
                          if (subPart.type === 'action' && subPart.action) {
                            return (
                              <ActionCard
                                key={subIndex}
                                name={subPart.action.name}
                                params={subPart.action.params}
                                messageId={m.id}
                                index={subIndex}
                              />
                            )
                          }
                          return null
                        })}
                      </div>
                    )
                  }
                  if (part.type === 'reasoning') {
                    return (
                      <div key={index} className="text-xs text-slate-400 dark:text-slate-500 italic border-l-2 border-slate-200 dark:border-slate-800 pl-3 my-2">
                        {part.text}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
              <Sparkles className="h-5 w-5 text-white animate-spin-slow" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/80 border border-white/40 dark:bg-slate-800/80 dark:border-white/5 p-5 max-w-[85%] flex items-center h-[60px] shadow-sm backdrop-blur-sm">
               <span className="flex space-x-2 items-center">
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
      <div className="p-6 relative z-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-t border-white/20 dark:border-white/5">
        <form onSubmit={handleSend} className="mx-auto max-w-4xl flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 p-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/60 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-300">
          <label className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer relative overflow-hidden">
            <Paperclip className="h-5 w-5" />
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // For simple implementation, read text files directly. 
                  // In production, you would upload this file to storage and extract text.
                  if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
                    const text = await file.text()
                    setInput(prev => prev + `\n[Attached File: ${file.name}]\n\`\`\`\n${text.substring(0, 2000)}${text.length > 2000 ? '\n...[truncated]' : ''}\n\`\`\`\n`)
                  } else {
                    setInput(prev => prev + `\n[File uploaded: ${file.name} - Please add a document parser for PDFs/Images] `)
                  }
                  e.target.value = '' // reset
                }
              }}
            />
          </label>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to summarize a module, or analyze a project..." 
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none dark:text-white dark:placeholder-slate-400 font-medium px-2"
          />
          <button 
            type="submit" 
            disabled={!(input || '').trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-3 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
