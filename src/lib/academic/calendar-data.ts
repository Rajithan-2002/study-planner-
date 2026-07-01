export interface UniversityCalendarEvent {
  id: string
  title: string
  description: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  durationText: string
  category: 'ACADEMIC' | 'EXAM' | 'LEAVE' | 'VACATION' | 'INTERNSHIP' | 'ORIENTATION'
  color: string
  badgeBg: string
}

export const UNIVERSITY_ACADEMIC_CALENDAR_2024_2025: UniversityCalendarEvent[] = []
