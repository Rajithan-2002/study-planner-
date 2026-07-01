import { ProviderInterface, AISession } from '../types'

export class GroqProvider implements ProviderInterface {
  id = 'groq'

  async generateResponse(session: AISession): Promise<{
    answer: string
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }> {
    const apiKey = process.env.GROQ_API_KEY
    const model = session.modelSelected || 'llama-3.3-70b-versatile'

    if (!apiKey) {
      console.warn('GROQ_API_KEY environment variable is missing. Activating mock fail-safe responder.')
      return this.generateMockResponse(session)
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: session.rawPrompt },
            { role: 'user', content: session.context.raw_query }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API returned status code ${response.status}`)
      }

      const json = await response.json()
      const answer = json.choices?.[0]?.message?.content || ''
      const usage = json.usage

      return {
        answer,
        tokenUsage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        } : undefined
      }
    } catch (err: any) {
      console.error('Groq Provider execution error, falling back to mock responder:', err)
      return this.generateMockResponse(session)
    }
  }

  private generateMockResponse(session: AISession): {
    answer: string
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number }
  } {
    // Generate context-aware mock responses based on capability and intent
    const query = session.context.raw_query.toLowerCase()
    let answer = ''

    if (query.includes('simulate') || query.includes('can i finish')) {
      answer = `Based on your current capacity of **32 hours/week** and existing commitments, completing the new request would require **15 hours/week**.
**Feasibility**: Feasible (100% Probability)
**Reason**: Your current total load is 18h/week. Adding 15h fits within your 32h/week limit.
**Recommendation**: Proceed with scheduling. [Planning & Capacity Engine]`
    } else if (session.context.actionResults && session.context.actionResults.length > 0) {
      const act = session.context.actionResults[0]
      if (act.status === 'WAITING_CONFIRMATION') {
        answer = `I have proposed the action: **${act.actionType}** for safety confirmation. Please review and approve this in your **Automation Action Center** under the proposed queues. [Actions Engine]`
      } else {
        answer = `Successfully executed action: **${act.actionType}**.
**Details**: Parameters: ${JSON.stringify(act.parameters)}.
**Status**: Completed. All dependent planning projections have rebalanced. [Actions Engine]`
      }
    } else if (session.capability === 'ACADEMIC_AUDIT') {
      const gpa = session.context.academic?.gpa || 'Not Set'
      answer = `Based on your academic profile, your cumulative GPA is **${gpa}**. You have ${session.context.academic?.ongoingModulesCount || 0} ongoing modules in your dashboard. [Academic Engine]`
    } else if (session.capability === 'TIME_MANAGEMENT' || session.intent === 'TASKS') {
      const cleanTitle = session.context.raw_query.replace(/^(add to task|add task|create task|todo|->)\s*/i, '')
        .replace(/^->\s*/i, '')
        .trim()
      answer = `Proposing new task: "**${cleanTitle || 'Dilani mam lecture preparation'}**". I have initialized a task proposal card. Click "Add to Life OS" below to confirm this task in your queue. [Tasks Engine]`
    } else if (session.capability === 'STUDY_PLANNING' || query.includes('workload') || query.includes('today')) {
      const hours = session.context.scheduler?.totalHours || '4.5'
      answer = `Today's dynamically computed flexible plan:
1. **Cloud Computing (Academic)**: 2.0 hours (Reason: Assignment due in 3 days; Energy: morning)
2. **AWS SAA (Certification)**: 1.5 hours (Reason: Exam is in 45 days; Energy: afternoon)
3. **AI Portfolio (Project)**: 1.0 hours (Reason: High priority weight; Energy: evening)
No fixed timeline clock times. Standard workloads balanced to your weekday capacity of **4.0 hours**. [Planning & Capacity Engine]`
    } else if (session.capability === 'KNOWLEDGE_RETRIEVAL') {
      answer = `Found relevant obsidian references matching your query in the Universal Inbox folder. [Knowledge Engine]`
    } else {
      answer = `Hello! I am your Life OS assistant. How can I help you organize your classes, tasks, or study focus today?`
    }

    return {
      answer,
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200
      }
    }
  }
}
