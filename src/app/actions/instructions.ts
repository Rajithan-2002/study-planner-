'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'

const INSTRUCTIONS_FILE_PATH = path.join(process.cwd(), 'user_instructions.md')

export interface InstructionSprintItem {
  name: string
  hours: number
  note?: string
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ParsedInstructions {
  rawContent: string
  isLeaveSprintActive: boolean
  sprintDates: string
  totalDailyHours: number
  dailyBreakdown: InstructionSprintItem[]
  postLeaveRules: {
    sc500Priority: string
    awsDaily: string
    cllmspDaily: string
    alternatingTracks: string
    weekendSchedule: string
  }
}

const DEFAULT_INSTRUCTIONS = `# User Study Instructions & Goals

## Current Sprint: 7-Day Leave High-Productivity Sprint
**Dates:** July 20, 2026 – July 26, 2026  
**Status:** Active Leave  
**Daily Allocated Study Time:** ~8.5 Hours / day  

### Daily Schedule Breakdown (July 20 - July 26):
1. **SC-500 Exam Prep:** 3 hours / day *(High Priority - Target: 40h total material before Aug 21)*
2. **Java Study:** 2 hours / day *(Target: Finish 10h video course during this 7-day leave)*
3. **AWS Cloud Practitioner:** 1 hour / day
4. **TryHackMe SOC Path:** 1 hour / day
5. **CRTA (Certified Red Team Analyst):** 1 hour / day
6. **CLLMSP:** 30 minutes / day

---

## Post-Leave Routine (Starting July 27, 2026)

### Weekday Routine (Mon - Fri):
* **Context:** Regular campus days resume.
* **Top Priority:** SC-500 exam prep (must complete 40h learning material before August 21 exam).
* **AWS Cloud Practitioner:** 30 minutes / day consistently.
* **Daily Consistent:** **CLLMSP** for 30 minutes / day.
* **Alternating Track:** Alternating daily between **TryHackMe SOC Path** (Day A) and **CRTA** (Day B).

### Weekend Routine (Saturday & Sunday):
* Reverts to high-intensity **Leave Schedule** (~8 hours / day).
* **Note:** Java is removed from weekend schedule (10h video completed during leave).
* SC-500, AWS Cloud Practitioner, TryHackMe, CRTA, and CLLMSP active on weekend slots.

---

## Long-Term Milestones & Deadlines
* **August 21, 2026:** SC-500 Exam (Must complete 40 hours of learning content prior to this date).
* **July 26, 2026:** Finish 10-Hour Java Video Course.
* **AWS Cloud Practitioner:** Daily steady progress (1h/day leave, 30m/day post-leave).
`

export async function getUserInstructions(): Promise<ParsedInstructions> {
  let content = ''
  try {
    content = await fs.readFile(INSTRUCTIONS_FILE_PATH, 'utf-8')
  } catch {
    content = DEFAULT_INSTRUCTIONS
    try {
      await fs.writeFile(INSTRUCTIONS_FILE_PATH, DEFAULT_INSTRUCTIONS, 'utf-8')
    } catch (e) {
      console.error('Failed to write default user instructions file:', e)
    }
  }

  return parseInstructions(content)
}

export async function saveUserInstructions(newContent: string) {
  try {
    await fs.writeFile(INSTRUCTIONS_FILE_PATH, newContent, 'utf-8')
    await syncInstructionsToTasks(newContent)

    revalidatePath('/')
    revalidatePath('/today')
    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Error saving user instructions:', err)
    return { success: false, error: err.message || 'Failed to save instructions' }
  }
}

export async function parseInstructions(content: string): Promise<ParsedInstructions> {
  const isLeaveSprintActive = content.toLowerCase().includes('active leave') || content.toLowerCase().includes('leave')
  
  // Extract Dates
  const dateMatch = content.match(/\*\*Dates:\*\*\s*(.*)/i)
  const sprintDates = dateMatch ? dateMatch[1].trim() : 'July 20, 2026 – July 26, 2026'

  // Extract total daily hours
  const hoursMatch = content.match(/\*\*Daily Allocated Study Time:\*\*\s*(.*)/i)
  let totalDailyHours = 8.5
  if (hoursMatch) {
    const parsedH = parseFloat(hoursMatch[1].replace(/[^0-9.]/g, ''))
    if (!isNaN(parsedH)) totalDailyHours = parsedH
  }

  // Known subjects parsed from instructions
  const dailyBreakdown: InstructionSprintItem[] = [
    { name: 'SC-500 Exam Prep', hours: 3.0, note: 'High Priority (Target 40h before Aug 21)', priority: 'CRITICAL' },
    { name: 'Java Study (10h Course)', hours: 2.0, note: 'Finish 10h video course during leave', priority: 'HIGH' },
    { name: 'AWS Cloud Practitioner', hours: 1.0, note: '1h/day during leave (30m post-leave)', priority: 'HIGH' },
    { name: 'TryHackMe SOC Path', hours: 1.0, note: 'SOC Analyst Track', priority: 'MEDIUM' },
    { name: 'CRTA (Red Team Analyst)', hours: 1.0, note: 'Red Team Track', priority: 'MEDIUM' },
    { name: 'CLLMSP', hours: 0.5, note: '30 mins daily consistent', priority: 'MEDIUM' },
  ]

  return {
    rawContent: content,
    isLeaveSprintActive,
    sprintDates,
    totalDailyHours,
    dailyBreakdown,
    postLeaveRules: {
      sc500Priority: 'Highest Priority (40h target before Aug 21)',
      awsDaily: '30 mins / day',
      cllmspDaily: '30 mins / day',
      alternatingTracks: 'TryHackMe SOC Path & CRTA alternating daily',
      weekendSchedule: 'Reverts to 8h Leave Schedule (minus Java)'
    }
  }
}

export async function syncInstructionsToTasks(customContent?: string) {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()
    const parsed = customContent ? await parseInstructions(customContent) : await getUserInstructions()

    const todayStr = new Date().toISOString().split('T')[0]

    // Create or update tasks corresponding to instruction sprint items
    for (const item of parsed.dailyBreakdown) {
      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('title', item.name)
        .eq('status', 'PENDING')
        .maybeSingle()

      if (!existing) {
        await supabase.from('tasks').insert({
          user_id: userId,
          title: item.name,
          description: item.note || `Sprint item: ${item.hours}h daily focus`,
          priority: item.priority || 'HIGH',
          estimated_hours: item.hours,
          status: 'PENDING',
          due_date: item.name.includes('Java') ? '2026-07-26' : item.name.includes('SC-500') ? '2026-08-21' : todayStr
        })
      }
    }

    revalidatePath('/')
    revalidatePath('/today')
    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Error syncing instructions to tasks:', err)
    return { success: false, error: err.message || 'Sync failed' }
  }
}
