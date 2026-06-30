export interface CertificationData {
  id: string
  name: string
  provider?: string | null
  cost?: number | null
  target_date?: string | null
  exam_date?: string | null
  status: string
  priority: string
  notes?: string | null
  daily_study_minutes?: number | null
  weekly_study_goal_hours?: number | null
  is_archived?: boolean | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface TopicData {
  id: string
  certification_id: string
  domain_name?: string | null
  title: string
  description?: string | null
  priority: string
  difficulty: string // EASY, MEDIUM, HARD
  estimated_study_hours?: number | null
  learning_status: string // NOT_STARTED, READING, PRACTICING, REVIEWING, MASTERED
  notes?: string | null
  tags?: string[] | null
  confidence_level?: number | null // 1 to 5
  last_studied_at?: string | null
  completion_date?: string | null
}

export interface SubtopicData {
  id: string
  topic_id: string
  title: string
  status: string // PENDING, COMPLETED
  completed_at?: string | null
}

export interface StudySessionData {
  id: string
  certification_id: string
  topic_id?: string | null
  duration_minutes: number
  notes?: string | null
  created_at?: string
}

// 1. Difficulty-weighted progress calculation
export function calculateTopicProgress(topicId: string, subtopics: SubtopicData[]): number {
  const topicSubtopics = subtopics.filter(s => s.topic_id === topicId)
  if (topicSubtopics.length === 0) return 0
  const completed = topicSubtopics.filter(s => s.status === 'COMPLETED').length
  return completed / topicSubtopics.length
}

export function getDifficultyWeight(difficulty: string): number {
  const clean = (difficulty || 'MEDIUM').trim().toUpperCase()
  switch (clean) {
    case 'EASY': return 1.0
    case 'HARD': return 2.0
    case 'MEDIUM':
    default:
      return 1.5
  }
}

export function calculateCertificationProgress(
  cert: CertificationData,
  topics: TopicData[],
  subtopics: SubtopicData[]
): number {
  if (cert.status === 'COMPLETED') return 100

  const certTopics = topics.filter(t => t.certification_id === cert.id)
  if (certTopics.length === 0) return 0

  let totalWeight = 0
  let completedWeight = 0

  certTopics.forEach(t => {
    const weight = getDifficultyWeight(t.difficulty)
    totalWeight += weight

    // If subtopics exist, use their progress. Otherwise, use learning_status.
    const subList = subtopics.filter(s => s.topic_id === t.id)
    if (subList.length > 0) {
      const topicProg = calculateTopicProgress(t.id, subList)
      completedWeight += weight * topicProg
    } else {
      const status = (t.learning_status || 'NOT_STARTED').toUpperCase()
      if (status === 'MASTERED') {
        completedWeight += weight
      } else if (status === 'REVIEWING') {
        completedWeight += weight * 0.8
      } else if (status === 'PRACTICING') {
        completedWeight += weight * 0.6
      } else if (status === 'READING') {
        completedWeight += weight * 0.3
      }
    }
  })

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
}

// 2. Exam Readiness Calculation
export function calculateExamReadiness(
  cert: CertificationData,
  topics: TopicData[],
  subtopics: SubtopicData[],
  sessions: StudySessionData[]
) {
  const progress = calculateCertificationProgress(cert, topics, subtopics)
  if (cert.status === 'COMPLETED' || progress === 100) {
    return { score: 100, label: 'Exam Ready' }
  }

  const certTopics = topics.filter(t => t.certification_id === cert.id)
  const certSessions = sessions.filter(s => s.certification_id === cert.id)

  // Confidence Factor (30% weight)
  let confidenceScore = 0
  if (certTopics.length > 0) {
    const avgConfidence = certTopics.reduce((sum, t) => sum + (t.confidence_level || 3), 0) / certTopics.length
    confidenceScore = ((avgConfidence - 1) / 4) * 100 // Map 1-5 to 0-100
  } else {
    confidenceScore = 50
  }

  // Study Consistency Factor (30% weight)
  // Base consistency on total logged sessions and study volume
  const totalMins = certSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const consistencyScore = Math.min(100, (certSessions.length * 10) + (totalMins / 60))

  // Combine components: 40% Progress, 30% Confidence, 30% Consistency
  const rawScore = Math.round((progress * 0.4) + (confidenceScore * 0.3) + (consistencyScore * 0.3))
  const score = Math.max(0, Math.min(100, rawScore))

  let label = 'Learning'
  if (score >= 90) label = 'Exam Ready'
  else if (score >= 70) label = 'Reviewing'
  else if (score >= 40) label = 'Practicing'
  else if (score > 0) label = 'Learning'
  else label = 'Not Started'

  return { score, label }
}

// 3. Recommended Study Planning
export function calculateDailyStudyRequirement(
  cert: CertificationData,
  topics: TopicData[],
  subtopics: SubtopicData[]
) {
  const certTopics = topics.filter(t => t.certification_id === cert.id)
  const progress = calculateCertificationProgress(cert, topics, subtopics)

  const remainingHours = certTopics.reduce((sum, t) => {
    const isDone = (t.learning_status || 'NOT_STARTED').toUpperCase() === 'MASTERED'
    if (isDone) return sum
    return sum + (t.estimated_study_hours || 0)
  }, 0)

  const examDate = cert.exam_date ? new Date(cert.exam_date).getTime() : null
  const now = new Date().getTime()
  const daysLeft = examDate ? Math.max(1, Math.ceil((examDate - now) / 86400000)) : null

  let recommendedDailyMins = cert.daily_study_minutes || 30
  if (daysLeft && remainingHours > 0) {
    const neededMinsPerDay = Math.ceil((remainingHours * 60) / daysLeft)
    recommendedDailyMins = Math.max(cert.daily_study_minutes || 30, neededMinsPerDay)
  }

  const projectedCompletionDate = remainingHours > 0
    ? new Date(now + (remainingHours * 60 / recommendedDailyMins) * 86400000).toISOString()
    : null

  return {
    remainingHours,
    daysLeft,
    recommendedDailyMins,
    projectedCompletionDate
  }
}

// 4. Aggregated Analytics
export function getCertAnalytics(
  certs: CertificationData[],
  topics: TopicData[],
  subtopics: SubtopicData[],
  sessions: StudySessionData[]
) {
  const activeCerts = certs.filter(c => !c.is_archived && c.status !== 'COMPLETED')
  const completedCerts = certs.filter(c => c.status === 'COMPLETED')

  let totalProgress = 0
  let totalReadiness = 0
  let totalStudyHours = 0

  activeCerts.forEach(c => {
    totalProgress += calculateCertificationProgress(c, topics, subtopics)
    totalReadiness += calculateExamReadiness(c, topics, subtopics, sessions).score
  })

  sessions.forEach(s => {
    totalStudyHours += s.duration_minutes / 60
  })

  const averageProgress = activeCerts.length > 0 ? Math.round(totalProgress / activeCerts.length) : 0
  const averageReadiness = activeCerts.length > 0 ? Math.round(totalReadiness / activeCerts.length) : 0

  return {
    activeCount: activeCerts.length,
    completedCount: completedCerts.length,
    averageProgress,
    averageReadiness,
    totalStudyHours: Math.round(totalStudyHours * 10) / 10
  }
}

// 5. Expose AI-ready learning context
export function getCertAIContext(
  cert: CertificationData,
  topics: TopicData[],
  subtopics: SubtopicData[],
  sessions: StudySessionData[]
) {
  const progress = calculateCertificationProgress(cert, topics, subtopics)
  const readiness = calculateExamReadiness(cert, topics, subtopics, sessions)
  const scheduling = calculateDailyStudyRequirement(cert, topics, subtopics)
  const certTopics = topics.filter(t => t.certification_id === cert.id)

  const weakTopics = certTopics
    .filter(t => (t.confidence_level || 3) <= 2)
    .map(t => `${t.title} (Confidence: ${t.confidence_level})`)

  return {
    certId: cert.id,
    name: cert.name,
    provider: cert.provider,
    status: cert.status,
    progressPercentage: progress,
    readinessScore: readiness.score,
    readinessStatus: readiness.label,
    daysUntilExam: scheduling.daysLeft,
    remainingStudyHours: scheduling.remainingHours,
    recommendedDailyStudyMinutes: scheduling.recommendedDailyMins,
    projectedCompletionDate: scheduling.projectedCompletionDate,
    totalTopics: certTopics.length,
    completedTopicsCount: certTopics.filter(t => (t.learning_status || 'NOT_STARTED').toUpperCase() === 'MASTERED').length,
    weakAreas: weakTopics,
    totalStudySessionsLogged: sessions.filter(s => s.certification_id === cert.id).length
  }
}
