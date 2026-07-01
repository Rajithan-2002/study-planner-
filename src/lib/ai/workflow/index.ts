import { AISession, AIResponse } from '../types'
import { IntentEngine } from '../intent'
import { CapabilityRegistry } from '../capabilities'
import { ContextBudgetManager } from '../context'
import { PromptRegistry } from '@/lib/ai/prompt/index'
import { AIGuardrails } from '../guardrails'
import { providerRegistry } from '../providers'
import { aiConfig } from '../config'
import { DecisionIntelligenceEngine } from '../decision/engine'
import { platformRegistry } from '@/lib/platform/registry'
import { ContextFusionEngine } from '../context-fusion/engine'
import { CoreActionEngine } from '@/lib/actions/engine'
import { PlanningCapacityEngine } from '../../planning/engine'

export class AIWorkflowEngine {
  static async runWorkflow(userId: string, rawQuery: string, sessionId?: string, isCaptureMode = false): Promise<AIResponse> {
    const startTime = Date.now()
    
    // 1. Initialize AISession object
    const session: AISession = {
      sessionId: sessionId || Math.random().toString(36).substring(7),
      userId,
      state: 'RECEIVED',
      intent: 'CONVERSATION',
      context: { raw_query: AIGuardrails.sanitizeInput(rawQuery), isCaptureMode },
      toolsExecuted: [],
      providerSelected: aiConfig.defaultProvider,
      modelSelected: aiConfig.defaultModel,
      errors: [],
      metrics: { startTime }
    }

    try {
      // 2. Classify Intent
      const classification = IntentEngine.classify(session.context.raw_query)
      session.intent = classification.intent
      session.state = 'INTENT_CLASSIFIED'

      // 3. Resolve Capability
      const capability = CapabilityRegistry.resolveFromIntent(session.intent)
      session.capability = capability.id

      // 4. Context Budget Gathering & RAG Retrieval
      session.context = await ContextBudgetManager.gatherContext(userId, capability.id, session.context.raw_query)
      
      const ragEngine = platformRegistry.getEngine('rag')
      if (ragEngine) {
        const ragRes = await ragEngine.calculate(userId, { query: session.context.raw_query })
        if (ragRes.success) {
          session.context.rag = ragRes.data
        }
      }

      session.state = 'CONTEXT_GATHERED'

      // Compile deterministic Decision Object before routing tools
      const decision = DecisionIntelligenceEngine.compileDecision(userId, 'BALANCED', session.context)
      session.context.decision = decision

      // Fuse long-term memory, preferences, and reflections into unified context payload
      session.context.fusedContext = await ContextFusionEngine.fuseContext(
        userId,
        session.context.raw_query,
        session.intent,
        session.context.decision,
        session.context.rag
      )

      // Autonomous Action & Natural Language CRUD Extraction
      const isActionOriented = 
        isCaptureMode ||
        session.intent.includes('PROJECT') || 
        session.intent.includes('STUDY') || 
        session.intent.includes('TASKS') || 
        session.context.raw_query.toLowerCase().includes('delete') ||
        session.context.raw_query.toLowerCase().includes('remove') ||
        session.context.raw_query.toLowerCase().includes('finish') ||
        session.context.raw_query.toLowerCase().includes('complete') ||
        session.context.raw_query.toLowerCase().includes('log') ||
        session.context.raw_query.toLowerCase().includes('can i finish') ||
        session.context.raw_query.toLowerCase().includes('simulate')

      if (isActionOriented) {
        try {
          const provider = providerRegistry.get(session.providerSelected)
          if (provider) {
            const todayDate = new Date()
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const todayStr = `${todayDate.toISOString().split('T')[0]} (${days[todayDate.getDay()]})`

            const extractionPrompt = `You are a structured data extractor.
Your job is to parse the user's natural language command and return a valid JSON object matching this schema:
{
  "actions": [
    {
      "action_type": "CREATE_TASK" | "CREATE_PROJECT" | "CREATE_CERTIFICATION" | "CREATE_DOMAIN" | "LOG_WORK_SESSION" | "DELETE_PROJECT" | "DELETE_CERTIFICATION" | "DELETE_TASK" | "RUN_SIMULATION" | "UPDATE_CAPACITY" | "CREATE_RECURRING" | "LOG_RECURRING" | "CREATE_FIXED" | "CREATE_VACATION",
      "parameters": {
        "title": string, // for tasks/routines e.g. "Finish DSA"
        "name": string, // for projects/certs/domains e.g. "Build AI Portfolio" or "Cyber Security"
        "due_date": "YYYY-MM-DD", // for tasks
        "target_completion_date": "YYYY-MM-DD", // for projects
        "target_exam_date": "YYYY-MM-DD", // for certs
        "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "difficulty": "EASY" | "MEDIUM" | "HARD",
        "estimated_total_hours": number,
        "duration_minutes": number, // for work sessions/fixed commitments
        "entity_type": "PROJECT" | "CERTIFICATION" | "ASSIGNMENT" | "EXAM" | "TASK", // for work sessions/deletes
        "entity_id": string, // if mentioned
        "notes": string,
        "deadline": "YYYY-MM-DD", // for simulations
        "weekday_hours": number, // for capacity updates e.g. 4
        "saturday_hours": number, // for capacity updates e.g. 8
        "sunday_hours": number, // for capacity updates e.g. 7
        "max_weekly_hours": number, // for capacity updates e.g. 32
        "type": "HABIT" | "ROUTINE" | "CHALLENGE" | "PRACTICE" | "MAINTENANCE", // for recurring activities
        "frequency": "DAILY" | "WEEKLY", // for recurring activities
        "days_of_week": string[], // e.g. ["MONDAY", "WEDNESDAY", "FRIDAY"] for weekly routines
        "estimated_minutes": number, // for routines e.g. 30
        "preferred_time": "MORNING" | "AFTERNOON" | "EVENING" | "ANYTIME", // for routines
        "scheduled_at": "YYYY-MM-DDTHH:MM:SSZ", // for fixed commitments
        "category": "LECTURE" | "OFFICE" | "MEETING" | "TRAVEL" | "FAMILY" | "OTHER", // for fixed commitments
        "start_date": "YYYY-MM-DD", // for vacations
        "end_date": "YYYY-MM-DD", // for vacations
        "capacity_multiplier": number // for vacations e.g. 0.0 or 0.5
      }
    }
  ]
}

COMMAND FORMAT RULES:
The user will often use the following structured formats to create entities. Parse them carefully:
1. Tasks: create task : "Task Name", "Date"
   - Action type: "CREATE_TASK"
   - Parameter "title": "Task Name"
   - Parameter "due_date": Parse "Date" (e.g. today, tomorrow, next week, July 10th) to YYYY-MM-DD using Reference Date.
2. Projects: create project : "Project Name", "Date"
   - Action type: "CREATE_PROJECT"
   - Parameter "name": "Project Name"
   - Parameter "target_completion_date": Parse "Date" to YYYY-MM-DD.
3. Certifications: create certification : "Cert Name", "Date"
   - Action type: "CREATE_CERTIFICATION"
   - Parameter "name": "Cert Name"
   - Parameter "target_exam_date": Parse "Date" to YYYY-MM-DD.
4. Domains: create domain : "Domain Name"
   - Action type: "CREATE_DOMAIN"
   - Parameter "name": "Domain Name"

If the user specifies a date relatively:
- "today": use today's date
- "tomorrow": use tomorrow's date
- "next week": compute the date 7 days from today
- Relative weekday (e.g., "Friday", "next Friday"): compute the date of the next occurrence of that weekday.
- Specific date (e.g., "July 10th", "July 10"): format as YYYY-MM-DD for the current or next upcoming year.

If no action is matching, return {"actions": []}.
Always output only valid raw JSON. Do NOT wrap in markdown block, do not write explanations.

Reference Date (Today): ${todayStr}
User Command: "${session.context.raw_query}"`

            const extractionSession: AISession = {
              sessionId: 'extraction-' + Math.random().toString(36).substring(7),
              userId,
              state: 'RECEIVED',
              intent: 'CONVERSATION',
              context: { raw_query: session.context.raw_query },
              toolsExecuted: [],
              providerSelected: session.providerSelected,
              modelSelected: session.modelSelected,
              errors: [],
              metrics: { startTime: Date.now() },
              rawPrompt: extractionPrompt
            }

            const extractionRes = await provider.generateResponse(extractionSession)
            if (extractionRes && extractionRes.answer) {
              const start = extractionRes.answer.indexOf('{')
              const end = extractionRes.answer.lastIndexOf('}')
              const jsonStr = start !== -1 && end !== -1 ? extractionRes.answer.substring(start, end + 1) : ''
              
              if (jsonStr) {
                const parsed = JSON.parse(jsonStr)
                if (parsed && Array.isArray(parsed.actions)) {
                  const resultsList = []
                  
                  for (const act of parsed.actions) {
                    if (act.action_type === 'RUN_SIMULATION') {
                      const est = Number(act.parameters.estimated_total_hours || 10)
                      const deadline = act.parameters.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      const sim = await PlanningCapacityEngine.runPlanningSimulation(userId, est, deadline)
                      session.context.simulationResult = sim
                    } else {
                      const targetEntity = act.parameters.entity_type || null
                      const targetId = act.parameters.entity_id || null
                      
                      const actionResult = await CoreActionEngine.requestAction(
                        userId,
                        act.action_type,
                        act.parameters,
                        targetEntity,
                        targetId
                      )
                      resultsList.push(actionResult)
                    }
                  }
                  session.context.actionResults = resultsList
                }
              }
            }
          }
        } catch (e: any) {
          console.error('[AI_WORKFLOW] Action extraction error:', e)
          session.errors.push(`Action extraction failed: ${e.message}`)
        }
      }

      // 5. Tool Routing & Execution (Deterministic wrapper based on required tools)
      session.state = 'TOOLS_ROUTED'
      for (const toolName of capability.requiredTools) {
        const check = AIGuardrails.checkToolPermission(toolName, {})
        if (!check.allowed) {
          session.errors.push(`Tool execution for "${toolName}" was skipped: ${check.reason}`)
          session.toolsExecuted.push({
            name: toolName,
            params: {},
            output: null,
            success: false
          })
          continue
        }

        // Mock execute tools for AI context using platform engine outputs
        session.toolsExecuted.push({
          name: toolName,
          params: {},
          output: session.context[toolName] || { info: 'No details available.' },
          success: true
        })
      }

      // Check if we have completed action results and compile deterministic confirmation response
      if (session.context.actionResults && session.context.actionResults.length > 0) {
        const completedActions = session.context.actionResults.filter((r: any) => r.status === 'COMPLETED')
        if (completedActions.length > 0) {
          const msgs = completedActions.map((r: any) => {
            if (r.actionType === 'CREATE_DOMAIN') {
              return `Success: Domain "${r.parameters.name}" has been created successfully.`
            }
            if (r.actionType === 'CREATE_TASK') {
              return `Success: Task "${r.parameters.title}" has been created successfully.`
            }
            if (r.actionType === 'CREATE_PROJECT') {
              return `Success: Project "${r.parameters.name}" has been created successfully.`
            }
            if (r.actionType === 'CREATE_CERTIFICATION') {
              return `Success: Certification "${r.parameters.name}" has been created successfully.`
            }
            return `Success: Action "${r.actionType}" executed successfully.`
          })
          
          session.rawLLMResponse = msgs.join('\n')
          session.state = 'COMPLETED'
          session.metrics.endTime = Date.now()
          session.metrics.durationMs = session.metrics.endTime - session.metrics.startTime

          return {
            answer: session.rawLLMResponse || '',
            citations: ['SYSTEM ACTIONS'],
            toolCalls: session.toolsExecuted.map(t => t.name),
            suggestions: [],
            warnings: session.errors,
            nextActions: [],
            confidence: 1.0
          }
        }
      }

      // 6. Prompt Construction
      session.rawPrompt = PromptRegistry.buildFinalPrompt(session)
      session.state = 'PROMPT_BUILT'

      // 7. Invoke Provider
      session.state = 'LLM_CALLED'
      const provider = providerRegistry.get(session.providerSelected)
      if (!provider) {
        throw new Error(`AI Provider "${session.providerSelected}" is not registered.`)
      }

      const result = await provider.generateResponse(session)
      session.rawLLMResponse = result.answer
      if (result.tokenUsage) {
        session.metrics.tokenUsage = result.tokenUsage
      }

      session.state = 'VALIDATED'
      session.metrics.endTime = Date.now()
      session.metrics.durationMs = session.metrics.endTime - session.metrics.startTime
      session.state = 'COMPLETED'

      // Log orchestration session metrics
      console.log(`[AI WORKFLOW COMPLETED] Session: ${session.sessionId} | Duration: ${session.metrics.durationMs}ms | Intent: ${session.intent}`)

      // 8. Standardize Structured AIResponse output
      return {
        answer: session.rawLLMResponse || 'No response compiled.',
        citations: capability.requiredTools.map(t => `${t.toUpperCase()} ENGINE`),
        toolCalls: session.toolsExecuted.map(t => t.name),
        suggestions: this.generateSuggestions(session.intent),
        warnings: session.errors,
        nextActions: this.generateNextActions(session.intent),
        confidence: classification.confidence
      }

    } catch (err: any) {
      session.state = 'ERROR'
      session.errors.push(err.message)
      console.error(`[AI WORKFLOW ERROR] Session: ${session.sessionId} | Error: ${err.message}`)

      return {
        answer: `I encountered an operational issue while processing your request: ${err.message}`,
        citations: [],
        toolCalls: [],
        suggestions: ['Retry query', 'Verify settings'],
        warnings: session.errors,
        nextActions: [],
        confidence: 0.0
      }
    }
  }

  private static generateSuggestions(intent: string): string[] {
    switch (intent) {
      case 'ACADEMIC': return ['Calculate GPA target', 'List upcoming assignments']
      case 'PROJECT': return ['Show project health dials', 'Update HackX milestones']
      case 'CERTIFICATION': return ['Launch CCNA study block', 'Start new study session']
      case 'SCHEDULER': return ['Propose balanced daily plan', 'Inspect overlapping collisions']
      default: return ['Help me study', 'Check my schedule']
    }
  }

  private static generateNextActions(intent: string): string[] {
    switch (intent) {
      case 'ACADEMIC': return ['View Semester Timetable', 'Go to Academic Hub']
      case 'SCHEDULER': return ['Propose balanced daily plan']
      default: return []
    }
  }
}
