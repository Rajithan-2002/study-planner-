import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { getDomains } from '@/app/actions/domains'
import { ProjectHubView } from '@/components/projects/ProjectHubView'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch all user projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      domain:domains(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch all user tasks for progress calculations
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  // Fetch all user project milestones
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')

  const domains = await getDomains()

  return (
    <ProjectHubView
      initialProjects={projects || []}
      initialTasks={tasks || []}
      initialMilestones={milestones || []}
      domains={domains || []}
    />
  )
}

