export interface AICapability {
  id: string
  name: string
  description: string
  requiredTools: string[]
}

export class CapabilityRegistry {
  private static capabilities: Map<string, AICapability> = new Map([
    [
      'STUDY_PLANNING',
      {
        id: 'STUDY_PLANNING',
        name: 'Intelligent Study Session Coordinator',
        description: 'Packs remaining academic exam milestones or certification subtopics into optimal focus scheduling blocks.',
        requiredTools: ['scheduler', 'certification']
      }
    ],
    [
      'PROJECT_ANALYSIS',
      {
        id: 'PROJECT_ANALYSIS',
        name: 'Project Milestones Analyzer',
        description: 'Evaluates the timeline of ongoing personal projects and warns about delayed phases.',
        requiredTools: ['project', 'knowledge']
      }
    ],
    [
      'ACADEMIC_AUDIT',
      {
        id: 'ACADEMIC_AUDIT',
        name: 'Academic standing auditor',
        description: 'Calculates degree GPA progress, ongoing semester modules, and lists assignment deadlines.',
        requiredTools: ['academic', 'tasks']
      }
    ],
    [
      'TIME_MANAGEMENT',
      {
        id: 'TIME_MANAGEMENT',
        name: 'Time Block Scheduler',
        description: 'Organizes daily schedule timeline plans and logs focus study blocks.',
        requiredTools: ['scheduler', 'tasks']
      }
    ],
    [
      'KNOWLEDGE_RETRIEVAL',
      {
        id: 'KNOWLEDGE_RETRIEVAL',
        name: 'Second Brain Searcher',
        description: 'Queries universal inbox files, Obsidian note references, and retrieves context.',
        requiredTools: ['knowledge']
      }
    ],
    [
      'GENERAL_CONVERSATION',
      {
        id: 'GENERAL_CONVERSATION',
        name: 'Conversational assistant',
        description: 'Answers standard conversational inputs and answers general planning tips.',
        requiredTools: []
      }
    ]
  ])

  static get(id: string): AICapability | undefined {
    return this.capabilities.get(id)
  }

  static resolveFromIntent(intent: string): AICapability {
    switch (intent) {
      case 'ACADEMIC':
        return this.capabilities.get('ACADEMIC_AUDIT')!
      case 'PROJECT':
        return this.capabilities.get('PROJECT_ANALYSIS')!
      case 'CERTIFICATION':
        return this.capabilities.get('STUDY_PLANNING')!
      case 'SCHEDULER':
      case 'TASKS':
        return this.capabilities.get('TIME_MANAGEMENT')!
      case 'KNOWLEDGE':
        return this.capabilities.get('KNOWLEDGE_RETRIEVAL')!
      default:
        return this.capabilities.get('GENERAL_CONVERSATION')!
    }
  }
}
