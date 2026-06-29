'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewCertDialog } from './new-cert-dialog'

export function NewCertButton({ domains }: { domains: { id: string, name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-650 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Add Certification
      </button>

      <NewCertDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        domains={domains} 
      />
    </>
  )
}
