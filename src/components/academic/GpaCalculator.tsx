'use client'

import { useState, useEffect } from 'react'
import { Award, BookOpen, Calculator, CheckCircle2, Info, RefreshCw, Save } from 'lucide-react'
import { updateCalculatedCgpa } from '@/app/actions/academic'

interface ModuleDef {
  code: string
  name: string
  y: number
  s: number
  cr: number
  def?: string
  nonGpa?: boolean
}

const modulesData: ModuleDef[] = [
  // YEAR 1 SEM 1
  { code: "MGTE 11243", name: "Principles of Management", y: 1, s: 1, cr: 3, def: "A+" },
  { code: "MGTE 11233", name: "Business Stats & Economics", y: 1, s: 1, cr: 3, def: "A-" },
  { code: "INTE 11213", name: "Fundamentals of Computing", y: 1, s: 1, cr: 3, def: "A+" },
  { code: "INTE 11223", name: "Programming Concepts", y: 1, s: 1, cr: 3, def: "A+" },
  { code: "DELT 11232", name: "English for Professionals", y: 1, s: 1, cr: 2, def: "B" },
  { code: "PMAT 11212", name: "Discrete Maths I", y: 1, s: 1, cr: 2, def: "A" },

  // YEAR 1 SEM 2
  { code: "MGTE 12253", name: "Accounting & Costing", y: 1, s: 2, cr: 3 },
  { code: "INTE 12243", name: "Computer Networks", y: 1, s: 2, cr: 3 },
  { code: "INTE 12213", name: "Object Oriented Programming", y: 1, s: 2, cr: 3 },
  { code: "INTE 12223", name: "Database Design", y: 1, s: 2, cr: 3 },
  { code: "MGTE 12263", name: "Optimization Methods", y: 1, s: 2, cr: 3, def: "A" },
  { code: "MGTE 12273", name: "Industry & Technology", y: 1, s: 2, cr: 3 },
  { code: "PMAT 12212", name: "Discrete Maths II", y: 1, s: 2, cr: 2 },

  // YEAR 2 SEM 1
  { code: "INTE 21213", name: "Information Systems Modelling", y: 2, s: 1, cr: 3 },
  { code: "INTE 21243", name: "Computer Architecture & OS", y: 2, s: 1, cr: 3 },
  { code: "INTE 21313", name: "Business Information Systems", y: 2, s: 1, cr: 3 },
  { code: "INTE 21323", name: "Web Application Development", y: 2, s: 1, cr: 3 },
  { code: "INTE 21333", name: "Event Driven Programming", y: 2, s: 1, cr: 3 },
  { code: "ACLT 21032", name: "Academic Literacy III", y: 2, s: 1, cr: 2, nonGpa: true },
  { code: "GNCT 23212", name: "Personal Progress Development", y: 2, s: 1, cr: 2, nonGpa: true },

  // YEAR 2 SEM 2
  { code: "INTE 22253", name: "Distributed Systems & Cloud", y: 2, s: 2, cr: 3 },
  { code: "INTE 22263", name: "Embedded Systems Development", y: 2, s: 2, cr: 3 },
  { code: "INTE 22283", name: "Mobile Applications Development", y: 2, s: 2, cr: 3 },
  { code: "INTE 22293", name: "Software Arch & Process", y: 2, s: 2, cr: 3 },
  { code: "INTE 22303", name: "Artificial Intelligence", y: 2, s: 2, cr: 3 },
  { code: "INTE 22313", name: "Software Design Patterns", y: 2, s: 2, cr: 3 },
  { code: "INTE 22343", name: "Data Structures & Algorithms", y: 2, s: 2, cr: 3 },

  // YEAR 3 SEM 1
  { code: "INTE 31233", name: "Human Computer Interaction", y: 3, s: 1, cr: 3 },
  { code: "INTE 31283", name: "Big Data and Data Warehousing", y: 3, s: 1, cr: 3 },
  { code: "INTE 31356", name: "Software Development Project", y: 3, s: 1, cr: 6 },
  { code: "INTE 31393", name: "Information Security", y: 3, s: 1, cr: 3 },
  { code: "INTE 31403", name: "System Administration and Maintenance", y: 3, s: 1, cr: 3 },
  { code: "MGTE 31373", name: "Project Management", y: 3, s: 1, cr: 3 },
  { code: "MGTE 31383", name: "Research Methods", y: 3, s: 1, cr: 3 },

  // YEAR 3 SEM 2
  { code: "GNCT 32216", name: "Internship (6 Months)", y: 3, s: 2, cr: 6, nonGpa: true },

  // YEAR 4 SEM 1
  { code: "INTE 41393", name: "System Integration Technologies", y: 4, s: 1, cr: 3 },
  { code: "MGTE 41323", name: "Professional Practices", y: 4, s: 1, cr: 3 },
  { code: "MGTE 41313", name: "Statistical Data Modelling", y: 4, s: 1, cr: 3 },
  { code: "INTE 41323", name: "Neural Networks and Deep Learning", y: 4, s: 1, cr: 3 },

  // YEAR 4 SEM 2
  { code: "INTE 43216", name: "Research Project", y: 4, s: 2, cr: 6 },
  { code: "MGTE 42323", name: "Strategic Quality Management & Lean Six Sigma", y: 4, s: 2, cr: 3 },
  { code: "MGTE 42333", name: "Business and IT Law", y: 4, s: 2, cr: 3 }
]

const gradeMap: Record<string, number> = {
  "": 0, "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "E": 0.0
}

export function GpaCalculator() {
  const [activeTab, setActiveTab] = useState<'all' | 'y1' | 'y2' | 'y3' | 'y4'>('all')
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize grades from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem('mit_cgpa_grades')
    if (saved) {
      try {
        setGrades(JSON.parse(saved))
        return
      } catch (e) {
        console.error('Failed to parse saved grades', e)
      }
    }

    // Set defaults if no saved data
    const initial: Record<string, string> = {}
    modulesData.forEach(m => {
      if (m.def) initial[m.code] = m.def
    })
    setGrades(initial)
  }, [])

  // Save to localStorage whenever grades change
  const handleGradeChange = (code: string, grade: string) => {
    const updated = { ...grades, [code]: grade }
    setGrades(updated)
    localStorage.setItem('mit_cgpa_grades', JSON.stringify(updated))
  }

  // Calculate GPAs
  const calculateGpaData = () => {
    const scores: Record<number, Record<number, { gp: number; cr: number }>> = {
      1: { 1: { gp: 0, cr: 0 }, 2: { gp: 0, cr: 0 } },
      2: { 1: { gp: 0, cr: 0 }, 2: { gp: 0, cr: 0 } },
      3: { 1: { gp: 0, cr: 0 }, 2: { gp: 0, cr: 0 } },
      4: { 1: { gp: 0, cr: 0 }, 2: { gp: 0, cr: 0 } }
    }

    modulesData.forEach(mod => {
      const grade = grades[mod.code] || ""
      if (grade !== "" && !mod.nonGpa) {
        const point = gradeMap[grade] ?? 0
        scores[mod.y][mod.s].gp += point * mod.cr
        scores[mod.y][mod.s].cr += mod.cr
      }
    })

    const yearStats: Record<number, { gp: number; cr: number; gpa: number }> = {}
    let totalGp = 0
    let totalCr = 0

    for (let y = 1; y <= 4; y++) {
      const yGp = scores[y][1].gp + scores[y][2].gp
      const yCr = scores[y][1].cr + scores[y][2].cr
      yearStats[y] = {
        gp: yGp,
        cr: yCr,
        gpa: yCr > 0 ? yGp / yCr : 0
      }
      totalGp += yGp
      totalCr += yCr
    }

    const cgpa = totalCr > 0 ? totalGp / totalCr : 0

    return {
      scores,
      yearStats,
      cgpa
    }
  }

  const gpaData = calculateGpaData()

  const handleSaveToProfile = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const completedPayload = modulesData
        .filter(m => grades[m.code] && grades[m.code] !== "")
        .map(m => ({
          code: m.code,
          name: m.name,
          credits: m.cr,
          grade: grades[m.code],
          year: m.y,
          semester: m.s
        }))

      const res = await updateCalculatedCgpa(parseFloat(gpaData.cgpa.toFixed(2)), completedPayload)
      if (res.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (e) {
      console.error('Failed to sync CGPA to profile', e)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSemesterTable = (yearNum: number, semNum: number) => {
    const semModules = modulesData.filter(m => m.y === yearNum && m.s === semNum)
    const semGp = gpaData.scores[yearNum][semNum].gp
    const semCr = gpaData.scores[yearNum][semNum].cr
    const semGpa = semCr > 0 ? semGp / semCr : 0

    return (
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="bg-secondary/40 border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-foreground text-sm">Semester 0{semNum}</h3>
          <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded">
            GPA: {semGpa.toFixed(2)}
          </span>
        </div>

        <div className="divide-y divide-border">
          {semModules.map(mod => {
            const currentGrade = grades[mod.code] || ""
            return (
              <div key={mod.code} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">{mod.code}</span>
                  <span className="text-xs font-bold text-foreground truncate">{mod.name}</span>
                  {mod.nonGpa && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5">Non-GPA</span>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center">{mod.cr} cr</span>
                  <select
                    value={currentGrade}
                    onChange={(e) => handleGradeChange(mod.code, e.target.value)}
                    className="bg-background border border-border text-xs font-bold rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer w-20 text-center"
                  >
                    <option value="">-</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D+">D+</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderYearSection = (yearNum: number, yearTitle: string) => {
    if (activeTab !== 'all' && activeTab !== `y${yearNum}`) return null

    return (
      <section className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-extrabold text-foreground whitespace-nowrap">{yearTitle}</h2>
          <div className="h-px w-full bg-border"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSemesterTable(yearNum, 1)}
          {renderSemesterTable(yearNum, 2)}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* STICKY HEADER DASHBOARD */}
      <div className="sticky top-0 z-30 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-6 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">MIT CGPA Calculator</h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
              University of Kelaniya IT Pathway • 4-Year Academic Tracker
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full lg:w-auto">
            {[1, 2, 3, 4].map(y => (
              <div key={y} className="bg-secondary/60 rounded-xl p-3 border border-border text-center">
                <span className="block text-[10px] text-muted-foreground font-bold uppercase">Year {y} GPA</span>
                <span className="text-base font-black text-foreground">{gpaData.yearStats[y].gpa.toFixed(2)}</span>
              </div>
            ))}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl p-3 text-center shadow-lg col-span-2 md:col-span-1 flex flex-col justify-center items-center relative overflow-hidden">
              <span className="block text-[10px] text-indigo-200 font-extrabold uppercase tracking-wider">Cumulative GPA</span>
              <span className="text-2xl font-black leading-none mt-0.5">{gpaData.cgpa.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action button to sync CGPA to profile */}
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleSaveToProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            {saveSuccess ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
            {saveSuccess ? 'CGPA Saved to Profile!' : 'Sync CGPA to Profile'}
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-border overflow-x-auto gap-2 pb-1">
        {[
          { id: 'all', label: 'All Years' },
          { id: 'y1', label: 'Year 1' },
          { id: 'y2', label: 'Year 2' },
          { id: 'y3', label: 'Year 3' },
          { id: 'y4', label: 'Year 4' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-5 font-extrabold text-xs rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* YEAR SECTIONS */}
      <div className="space-y-12">
        {renderYearSection(1, "First Academic Year")}
        {renderYearSection(2, "Second Academic Year")}
        {renderYearSection(3, "Third Academic Year")}
        {renderYearSection(4, "Fourth Academic Year")}
      </div>

      {/* OFFICIAL GRADING REFERENCE TABLE */}
      <section className="bg-card rounded-2xl border border-border p-6 shadow-xs">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-primary" />
          University of Kelaniya Grading Scale Reference
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { grade: "A+ / A", range: "85-100 / 70-84", gpa: "4.0" },
            { grade: "A-", range: "65 - 69", gpa: "3.7" },
            { grade: "B+", range: "60 - 64", gpa: "3.3" },
            { grade: "B", range: "55 - 59", gpa: "3.0" },
            { grade: "B-", range: "50 - 54", gpa: "2.7" },
            { grade: "C+", range: "45 - 49", gpa: "2.3" },
            { grade: "C", range: "40 - 44", gpa: "2.0" },
            { grade: "C-", range: "35 - 39", gpa: "1.7" },
            { grade: "D+", range: "30 - 34", gpa: "1.3" },
            { grade: "D", range: "25 - 29", gpa: "1.0" },
            { grade: "E", range: "00 - 24", gpa: "0.0", color: "text-destructive" },
          ].map((g, idx) => (
            <div key={idx} className="p-3 bg-secondary/50 rounded-xl border border-border text-center">
              <p className={`text-xs font-black ${g.color || 'text-primary'}`}>{g.grade}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{g.range}</p>
              <p className="text-sm font-extrabold text-foreground mt-1">{g.gpa}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
