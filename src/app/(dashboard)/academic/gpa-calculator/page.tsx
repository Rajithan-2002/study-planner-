import { GpaCalculator } from '@/components/academic/GpaCalculator'
import Link from 'next/link'
import { Calculator } from 'lucide-react'

export default function GpaCalculatorPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans flex items-center gap-3">
            <Calculator className="h-7 w-7 text-primary" />
            CGPA Calculator
          </h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Calculate and track your semester-by-semester and cumulative 4-year GPA.
          </p>
        </div>
        <Link href="/academic" className="text-xs font-bold text-primary hover:underline">
          &larr; Back to Academic Hub
        </Link>
      </div>

      <GpaCalculator />
    </div>
  )
}
