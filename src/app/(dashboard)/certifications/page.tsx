import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { getDomains } from '@/app/actions/domains'
import { CertHubView } from '@/components/certifications/CertHubView'

export default async function CertificationsPage() {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // Fetch certifications
  const { data: certs } = await supabase
    .from('certifications')
    .select(`
      *,
      domain:domains(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch all tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  // Fetch all topics
  const { data: topics } = await supabase
    .from('certification_topics')
    .select('*')
    .order('order_index', { ascending: true })

  // Fetch all subtopics
  const { data: subtopics } = await supabase
    .from('certification_subtopics')
    .select('*')
    .order('order_index', { ascending: true })

  // Fetch all study sessions
  const { data: sessions } = await supabase
    .from('certification_study_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  const domains = await getDomains()

  return (
    <CertHubView
      certs={certs || []}
      topics={topics || []}
      subtopics={subtopics || []}
      sessions={sessions || []}
      domains={domains || []}
      tasks={tasks || []}
    />
  )
}
