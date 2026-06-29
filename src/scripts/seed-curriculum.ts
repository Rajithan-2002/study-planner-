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
  // YEAR 1 SEMESTER 1 (Compulsory)
  { course_code: 'ENG101', course_name: 'English for Professionals', credits: 2, year: 1, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'COMP101', course_name: 'Fundamentals of Computing', credits: 3, year: 1, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'PROG101', course_name: 'Programming Concepts', credits: 3, year: 1, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'BUS101', course_name: 'Business Statistics and Economics', credits: 3, year: 1, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'MGT101', course_name: 'Principles of Management & Organizational Behaviour', credits: 3, year: 1, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'MATH101', course_name: 'Discrete Mathematics for Computing I', credits: 3, year: 1, semester: 1, is_compulsory: true, category: 'Core' },

  // YEAR 1 SEMESTER 2 (Compulsory)
  { course_code: 'ACC102', course_name: 'Accounting Concepts and Costing', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'NET102', course_name: 'Computer Networks', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'OOP102', course_name: 'Object Oriented Programming', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['PROG101'] },
  { course_code: 'DB102', course_name: 'Database Design and Development', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'OPT102', course_name: 'Optimization Methods in Management Science', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'IND102', course_name: 'Industry and Technology', credits: 2, year: 1, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'MATH102', course_name: 'Discrete Mathematics for Computing II', credits: 3, year: 1, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['MATH101'] },

  // YEAR 2 SEMESTER 1 (Compulsory)
  { course_code: 'ISM201', course_name: 'Information Systems Modelling', credits: 3, year: 2, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'BIS201', course_name: 'Business Information Systems', credits: 3, year: 2, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'WEB201', course_name: 'Web Applications Development', credits: 3, year: 2, semester: 1, is_compulsory: true, category: 'Core', prerequisites: ['OOP102', 'DB102'] },
  { course_code: 'EDP201', course_name: 'Event Driven Programming', credits: 3, year: 2, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'ARC201', course_name: 'Computer Architecture and Operating Systems', credits: 3, year: 2, semester: 1, is_compulsory: true, category: 'Core' },

  // YEAR 2 SEMESTER 2 (Compulsory)
  { course_code: 'SA202', course_name: 'Software Architecture and Process Models', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'DSA202', course_name: 'Data Structures and Algorithms', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['OOP102'] },
  { course_code: 'DIST202', course_name: 'Distributed Systems and Cloud Computing', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['NET102'] },
  { course_code: 'EMB202', course_name: 'Embedded Systems Development', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['ARC201'] },
  { course_code: 'AI202', course_name: 'Artificial Intelligence', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core' },
  { course_code: 'SDP202', course_name: 'Software Design Patterns and Frameworks', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core', prerequisites: ['OOP102'] },
  { course_code: 'MOB202', course_name: 'Mobile Applications Development', credits: 3, year: 2, semester: 2, is_compulsory: true, category: 'Core' },

  // YEAR 3 OPTIONS
  { course_code: 'SQE301', course_name: 'Software Quality Engineering', credits: 3, year: 3, semester: 1, is_compulsory: false, category: 'Elective', track: 'Software Engineering' },
  { course_code: 'BIG301', course_name: 'Big Data and Data Warehousing', credits: 3, year: 3, semester: 1, is_compulsory: false, category: 'Elective', track: 'Data Science', prerequisites: ['DB102'] },
  { course_code: 'ML301', course_name: 'Machine Learning', credits: 3, year: 3, semester: 1, is_compulsory: false, category: 'Elective', track: 'Data Science', prerequisites: ['AI202'] },
  { course_code: 'SYS301', course_name: 'System Administration and Maintenance', credits: 3, year: 3, semester: 2, is_compulsory: false, category: 'Elective', track: 'IT' },
  { course_code: 'RES301', course_name: 'Research Methods', credits: 2, year: 3, semester: 2, is_compulsory: false, category: 'Core' },
  { course_code: 'MATH301', course_name: 'Mathematics for Computing III', credits: 3, year: 3, semester: 2, is_compulsory: false, category: 'Elective', prerequisites: ['MATH102'] },

  // YEAR 4 OPTIONS (Dummies)
  { course_code: 'PROJ401', course_name: 'Final Year Project', credits: 6, year: 4, semester: 1, is_compulsory: true, category: 'Core' },
  { course_code: 'SEC401', course_name: 'Cyber Security', credits: 3, year: 4, semester: 1, is_compulsory: false, category: 'Elective' },
  { course_code: 'NLP401', course_name: 'Natural Language Processing', credits: 3, year: 4, semester: 2, is_compulsory: false, category: 'Elective', track: 'Data Science', prerequisites: ['ML301'] },
]

async function seed() {
  console.log('Seeding Curriculum Modules...')
  
  // Clear existing
  await supabase.from('curriculum_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data, error } = await supabase.from('curriculum_modules').insert(curriculum).select()

  if (error) {
    console.error('Error seeding:', error)
  } else {
    console.log(`Successfully seeded ${data.length} modules!`)
  }
}

seed()
