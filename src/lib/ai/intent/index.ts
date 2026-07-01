export class IntentEngine {
  static classify(query: string): { intent: string; confidence: number } {
    const text = query.toLowerCase()

    // 1. Tasks Intent (Higher priority for action directives)
    if (
      text.includes('add to task') ||
      text.includes('create task') ||
      text.includes('task') ||
      text.includes('todo') ||
      text.includes('due') ||
      text.includes('priority')
    ) {
      return { intent: 'TASKS', confidence: 0.95 }
    }

    // 2. Academic Intent
    if (
      text.includes('gpa') ||
      text.includes('semester') ||
      text.includes('module') ||
      text.includes('course') ||
      text.includes('assignment') ||
      text.includes('exam') ||
      text.includes('lecture')
    ) {
      return { intent: 'ACADEMIC', confidence: 0.95 }
    }

    // 2. Project Intent
    if (
      text.includes('project') ||
      text.includes('milestone') ||
      text.includes('hackx') ||
      text.includes('startup') ||
      text.includes('repos') ||
      text.includes('github')
    ) {
      return { intent: 'PROJECT', confidence: 0.92 }
    }

    // 3. Certification Intent
    if (
      text.includes('cert') ||
      text.includes('exam target') ||
      text.includes('study session') ||
      text.includes('ccna') ||
      text.includes('aws') ||
      text.includes('azure')
    ) {
      return { intent: 'CERTIFICATION', confidence: 0.94 }
    }

    // 4. Scheduler Intent
    if (
      text.includes('schedule') ||
      text.includes('calendar') ||
      text.includes('today') ||
      text.includes('tomorrow') ||
      text.includes('time block') ||
      text.includes('free time') ||
      text.includes('conflict') ||
      text.includes('workload') ||
      text.includes('plan')
    ) {
      return { intent: 'SCHEDULER', confidence: 0.90 }
    }

    // 5. Knowledge/Search Intent
    if (
      text.includes('search') ||
      text.includes('find note') ||
      text.includes('lookup file') ||
      text.includes('pdf') ||
      text.includes('inbox') ||
      text.includes('brain')
    ) {
      return { intent: 'KNOWLEDGE', confidence: 0.88 }
    }

    // Default general conversation
    return { intent: 'CONVERSATION', confidence: 0.60 }
  }
}
