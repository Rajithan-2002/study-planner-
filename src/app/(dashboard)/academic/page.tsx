import { getAcademicProfile, getWeeklyTimetable, getAcademicRoadmap } from '@/app/actions/academic'
import { AcademicHubView } from '@/components/academic/AcademicHubView'

export default async function AcademicHubPage() {
  const { user, currentSemester, allModules, semesters } = await getAcademicProfile()
  const { curriculum } = await getAcademicRoadmap()
  const timetable = await getWeeklyTimetable()

  return (
    <AcademicHubView
      user={user}
      currentSemester={currentSemester}
      allModules={allModules || []}
      semesters={semesters || []}
      timetable={timetable || []}
      curriculumCatalog={curriculum || []}
    />
  )
}

