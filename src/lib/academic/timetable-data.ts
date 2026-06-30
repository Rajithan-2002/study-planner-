export interface MasterTimetableSession {
  code: string
  name: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  start_time: string
  end_time: string
  location: string
  session_type: 'LECTURE' | 'PRACTICAL' | 'TUTORIAL'
  lecturer?: string
}

export const MASTER_MIT_SEMESTER_2_TIMETABLE: MasterTimetableSession[] = [
  // MONDAY
  {
    code: 'INTE 22303',
    name: 'Artificial Intelligence',
    day: 'Monday',
    start_time: '09:00:00',
    end_time: '10:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'CR'
  },
  {
    code: 'INTE 22313',
    name: 'Software Design Patterns and Frameworks',
    day: 'Monday',
    start_time: '13:00:00',
    end_time: '14:55:00',
    location: 'A4-302',
    session_type: 'LECTURE',
    lecturer: 'DA'
  },

  // TUESDAY
  {
    code: 'MGTE 22273',
    name: 'Human Resource Management & Leadership Communication',
    day: 'Tuesday',
    start_time: '08:00:00',
    end_time: '10:55:00',
    location: 'A8 103',
    session_type: 'LECTURE',
    lecturer: 'Dr. Prabashini'
  },
  {
    code: 'GNCT 23212a',
    name: 'Personal Progress Development II',
    day: 'Tuesday',
    start_time: '11:00:00',
    end_time: '12:55:00',
    location: 'A8-203',
    session_type: 'TUTORIAL',
    lecturer: 'TM/CO'
  },
  {
    code: 'INTE 22253',
    name: 'Distributed Systems and Cloud Computing',
    day: 'Tuesday',
    start_time: '13:00:00',
    end_time: '14:55:00',
    location: 'A8-203',
    session_type: 'LECTURE',
    lecturer: 'Udith'
  },

  // WEDNESDAY
  {
    code: 'INTE 22293',
    name: 'Software Architecture and Process Models',
    day: 'Wednesday',
    start_time: '08:00:00',
    end_time: '10:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'DW'
  },
  {
    code: 'INTE 31356',
    name: 'Software Development Project',
    day: 'Wednesday',
    start_time: '13:00:00',
    end_time: '15:55:00',
    location: 'Project Lab',
    session_type: 'PRACTICAL',
    lecturer: 'All'
  },

  // THURSDAY
  {
    code: 'INTE 22283',
    name: 'Mobile Applications Development',
    day: 'Thursday',
    start_time: '08:00:00',
    end_time: '09:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'SH'
  },
  {
    code: 'INTE 22263',
    name: 'Embedded Systems Development (Lecture)',
    day: 'Thursday',
    start_time: '10:00:00',
    end_time: '11:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'KW'
  },
  {
    code: 'INTE 22263',
    name: 'Embedded Systems Development (Practical BYOD)',
    day: 'Thursday',
    start_time: '13:00:00',
    end_time: '14:55:00',
    location: 'BYOD Lab',
    session_type: 'PRACTICAL',
    lecturer: 'KW'
  },
  {
    code: 'MGTE 22263',
    name: 'Logistics and Supply Chain Management',
    day: 'Thursday',
    start_time: '13:00:00',
    end_time: '15:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'PC/CK'
  },

  // FRIDAY
  {
    code: 'INTE 22343',
    name: 'Data Structures and Algorithms',
    day: 'Friday',
    start_time: '09:00:00',
    end_time: '12:55:00',
    location: 'A8 203',
    session_type: 'LECTURE',
    lecturer: 'KW'
  }
]

export function getTimetableForDegree(degreeName?: string | null): MasterTimetableSession[] {
  if (!degreeName) return MASTER_MIT_SEMESTER_2_TIMETABLE

  const isIT = degreeName.includes('Information Technology (IT)') || (degreeName.includes('IT') && !degreeName.includes('Management'))
  
  if (isIT) {
    // IT students timetable: All compulsory modules + additional INTE modules (excluding pure MGTE management modules)
    return MASTER_MIT_SEMESTER_2_TIMETABLE.filter(session => !session.code.startsWith('MGTE'))
  }

  // MIT students timetable: All compulsory modules + MGTE modules (Full MIT timetable)
  return MASTER_MIT_SEMESTER_2_TIMETABLE
}
