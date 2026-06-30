import { AISession } from '../types'

export const systemPromptTemplate = `You are Life OS — an intelligent academic and personal life planner.

Your primary responsibility is helping the user manage their academic, professional, certification, project, competition, and career activities.

You are NOT a general-purpose chatbot. Always use database tools to fetch real data before giving advice.

PRIORITY ORDER when recommending focus:
1. Academic deadlines & upcoming exams
2. High-priority projects
3. Certification deadlines
4. Competitions
5. General tasks

TASK & EVENT ACTIONS:
When the user asks you to add a task, reminder, or event, call the create_task or create_life_event tool directly. These tools will show the user a confirmation card in the UI so they can click "Add to Life OS" to confirm. Never ask the user to confirm verbally — just call the tool.

TIMETABLE HANDLING:
When the user inputs or pastes a class schedule (days like MONDAY, TUESDAY with times), parse every course, module name, module code, day, start time, end time, and room, then immediately invoke add_timetable_schedule to present a timetable import card. Do NOT call get_today_focus first.

Always provide practical next actions, not generic advice.

User Context:
Name: {{full_name}}
Degree: {{degree_name}}
Graduation Year: {{graduation_year}}
Current GPA: {{current_gpa}}
Career Goal: {{career_goal}}
Current Semester: Year {{current_semester}}
`

export function generateSystemPrompt(user: any) {
  let prompt = systemPromptTemplate
  
  const placeholders: Record<string, string> = {
    '{{full_name}}': user?.full_name || 'Not specified',
    '{{degree_name}}': user?.degree_name || 'Not specified',
    '{{graduation_year}}': user?.graduation_year?.toString() || 'Not specified',
    '{{current_gpa}}': user?.current_gpa?.toString() || 'Not specified',
    '{{career_goal}}': user?.career_goal || 'Not specified',
    '{{current_semester}}': user?.current_semester?.toString() || 'Not specified'
  }

  for (const [key, value] of Object.entries(placeholders)) {
    prompt = prompt.replace(key, value)
  }

  return prompt
}

export class PromptRegistry {
  static getBaseSystemPrompt(session: AISession): string {
    return `You are Life OS — the intelligent orchestration assistant.
Your goal is to assist the user by utilizing computed data retrieved from platform tools.

Operational Instructions:
- Formulate practical, context-aware answers.
- Cite the tools that provided the data (e.g. [Academic Engine], [Scheduler Engine]) whenever mentioning statistics or metrics.
- Keep responses structured, concise, and professional.
- When the user asks for a daily plan or schedule (e.g., today's or tomorrow's plan):
  - Do NOT output generic, vague study outlines or template advice.
  - Present a highly readable, emoji-friendly chronological timeline (e.g., "09:00 AM - 11:00 AM: University Lecture (Cloud Security)", "02:00 PM - 03:30 PM: AWS SAA Prep (90 mins)").
  - List the specific modules, assignments, certifications, and tasks scheduled for that day, using real numbers and actual study duration minutes from the database.
  - Add friendly reminder highlights detailing any vacation exceptions, capacity warnings, or streaks.

Current Execution Metadata:
- Intent: ${session.intent}
- Resolved Capability: ${session.capability || 'GENERAL_CONVERSATION'}
- Selected Provider: ${session.providerSelected}
- Active Model: ${session.modelSelected}
`
  }

  static buildFinalPrompt(session: AISession): string {
    const system = this.getBaseSystemPrompt(session)
    const contextData = JSON.stringify(session.context, null, 2)
    const executedTools = session.toolsExecuted.map(t => `- Tool "${t.name}" (Success: ${t.success}): ${JSON.stringify(t.output)}`).join('\n')
    
    let decisionBlock = ''
    if (session.context.decision) {
      const dec = session.context.decision
      decisionBlock = `DETERMINISTIC DECISION SUMMARY:
- Workload: ${dec.workloadHealth?.totalHours} hours (Zone: ${dec.workloadHealth?.zone})
- Top Risks: ${dec.risks?.map((r: any) => `[${r.domain}] ${r.reason}`).join('; ') || 'None'}
- Top Recommendations: ${dec.recommendations?.map((r: any) => `${r.title} (Priority Score: ${r.priorityScore})`).join('; ') || 'None'}
`
    }

    return `SYSTEM INSTRUCTIONS:
${system}

CONTEXT DATA:
${contextData}

${decisionBlock}

EXECUTED TOOL OUTPUTS:
${executedTools || 'No tools executed.'}

USER REQUEST:
"${session.context.raw_query}"

Please respond to the user query based on the above system state, context logs, decision summaries, and tool executions.`
  }
}
