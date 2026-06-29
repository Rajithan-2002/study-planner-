'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { UploadDialog } from './upload-dialog'

export function UploadButton({ domains }: { domains: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-650 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
      >
        <Upload className="h-4 w-4" />
        Upload
      </button>

      <UploadDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        domains={domains}
      />
    </>
  )
}
