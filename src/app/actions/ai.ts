'use server'

import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { AIWorkflowEngine } from '@/lib/ai/workflow'

export async function askAssistant(query: string, sessionId?: string) {
  try {
    const userId = await getCurrentUserId()
    const response = await AIWorkflowEngine.runWorkflow(userId, query, sessionId)

    // Save logs to public.ai_tool_logs for dashboard observability metrics
    const supabase = await createClient()
    await supabase.from('ai_tool_logs').insert({
      user_id: userId,
      tool_name: 'AI_GATEWAY_WORKFLOW',
      input: { query, sessionId },
      output: { response }
    })

    return { success: true, response }
  } catch (err: any) {
    console.error('askAssistant exception:', err)
    return { success: false, error: err.message || 'Failed to route prompt through orchestration pipeline.' }
  }
}
