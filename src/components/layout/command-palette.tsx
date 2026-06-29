'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, CheckSquare, GraduationCap, Briefcase, Award, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const actions = [
    { id: 'search-knowledge', label: 'Search Knowledge', icon: Search, shortcut: 'K', route: '/knowledge' },
    { id: 'create-task', label: 'Create Task', icon: CheckSquare, shortcut: 'T', route: '/projects' },
    { id: 'create-project', label: 'Create Project', icon: Briefcase, shortcut: 'P', route: '/projects' },
    { id: 'open-academic', label: 'Open Academic Hub', icon: GraduationCap, shortcut: 'A', route: '/academic' },
    { id: 'go-to-cert', label: 'Go To Certifications', icon: Award, shortcut: 'C', route: '/certifications' },
  ]

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (route: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(route)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-800 overflow-hidden">
              <div className="flex items-center px-4 border-b dark:border-gray-800">
                <Search className="h-5 w-5 text-gray-400" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="What do you need? (e.g., 'Search Knowledge')"
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white px-4 py-4 text-lg placeholder-gray-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredActions.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">No actions found.</p>
                ) : (
                  filteredActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleSelect(action.route)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 border dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 shadow-sm">
                        {action.shortcut}
                      </span>
                    </button>
                  ))
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t dark:border-gray-800 flex items-center justify-between text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Use <kbd className="font-sans px-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">↑↓</kbd> to navigate</span>
                  <span>Use <kbd className="font-sans px-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Enter</kbd> to select</span>
                </div>
                <span>esc to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
