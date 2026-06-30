import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env.local')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const curriculum = [
  // YEAR 1 SEMESTER 1
  { course_code: "MGTE 11243", course_name: "Principles of Management", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "Management" },
  { course_code: "MGTE 11233", course_name: "Business Statistics and Economics", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "Economics" },
  { course_code: "INTE 11213", course_name: "Fundamentals of Computing", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 11223", course_name: "Programming Concepts", credits: 3, year: 1, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "DELT 11232", course_name: "English for Professionals", credits: 2, year: 1, semester: 1, is_compulsory: true, category: "Languages" },
  { course_code: "PMAT 11212", course_name: "Discrete Mathematics I", credits: 2, year: 1, semester: 1, is_compulsory: true, category: "Maths" },

  // YEAR 1 SEMESTER 2
  { course_code: "MGTE 12253", course_name: "Accounting Concepts and Costing", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
  { course_code: "INTE 12243", course_name: "Computer Networks", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 12213", course_name: "Object Oriented Programming", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 12223", course_name: "Database Design and Development", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "MGTE 12263", course_name: "Optimization Methods in Management Science", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
  { course_code: "MGTE 12273", course_name: "Industry and Technology", credits: 3, year: 1, semester: 2, is_compulsory: true, category: "Management" },
  { course_code: "PMAT 12212", course_name: "Discrete Mathematics II", credits: 2, year: 1, semester: 2, is_compulsory: true, category: "Maths" },

  // YEAR 2 SEMESTER 1
  { course_code: "INTE 21213", course_name: "Information Systems Modelling", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 21243", course_name: "Computer Architecture and Operating Systems", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 21313", course_name: "Business Information Systems", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 21323", course_name: "Web Application Development", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 21333", course_name: "Event Driven Programming", credits: 3, year: 2, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "ACLT 21032", course_name: "Academic Literacy III", credits: 2, year: 2, semester: 1, is_compulsory: false, category: "Languages" },
  { course_code: "GNCT 23212", course_name: "Personal Progress Development", credits: 2, year: 2, semester: 1, is_compulsory: false, category: "General" },

  // YEAR 2 SEMESTER 2
  { course_code: "INTE 22253", course_name: "Distributed Systems and Cloud Computing", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22263", course_name: "Embedded Systems Development", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22283", course_name: "Mobile Applications Development", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22293", course_name: "Software Architecture and Process Models", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22303", course_name: "Artificial Intelligence", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22313", course_name: "Software Design Patterns and Frameworks", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "INTE 22343", course_name: "Data Structures and Algorithms", credits: 3, year: 2, semester: 2, is_compulsory: true, category: "IT" },

  // YEAR 3 SEMESTER 1
  { course_code: "INTE 31233", course_name: "Human Computer Interaction", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 31283", course_name: "Big Data and Data Warehousing", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 31356", course_name: "Software Development Project", credits: 6, year: 3, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 31393", course_name: "Information Security", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "INTE 31403", course_name: "System Administration and Maintenance", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "MGTE 31373", course_name: "Project Management", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "Management" },
  { course_code: "MGTE 31383", course_name: "Research Methods", credits: 3, year: 3, semester: 1, is_compulsory: true, category: "Management" },

  // YEAR 3 SEMESTER 2
  { course_code: "GNCT 32216", course_name: "Internship (6 Months)", credits: 6, year: 3, semester: 2, is_compulsory: false, category: "General" },

  // YEAR 4 SEMESTER 1
  { course_code: "INTE 41393", course_name: "System Integration Technologies", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "IT" },
  { course_code: "MGTE 41323", course_name: "Professional Practices", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "Management" },
  { course_code: "MGTE 41313", course_name: "Statistical Data Modelling", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "Management" },
  { course_code: "INTE 41323", course_name: "Neural Networks and Deep Learning", credits: 3, year: 4, semester: 1, is_compulsory: true, category: "IT" },

  // YEAR 4 SEMESTER 2
  { course_code: "INTE 43216", course_name: "Research Project", credits: 6, year: 4, semester: 2, is_compulsory: true, category: "IT" },
  { course_code: "MGTE 42323", course_name: "Strategic Quality Management & Lean Six Sigma", credits: 3, year: 4, semester: 2, is_compulsory: true, category: "Management" },
  { course_code: "MGTE 42333", course_name: "Business and IT Law", credits: 3, year: 4, semester: 2, is_compulsory: true, category: "Management" }
]

async function seed() {
  console.log('Seeding Master Kelaniya MIT Curriculum Modules...')
  
  await supabase.from('curriculum_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data, error } = await supabase.from('curriculum_modules').insert(curriculum).select()

  if (error) {
    console.error('Error seeding:', error)
  } else {
    console.log(`Successfully seeded ${data.length} master MIT curriculum modules!`)
  }
}

seed()
