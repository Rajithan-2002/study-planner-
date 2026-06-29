import { createGroq } from '@ai-sdk/groq'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { createClient, getCurrentUserId } from '@/utils/supabase/server'
import { generateSystemPrompt } from '@/lib/ai/prompt'
import {
  get_today_focus,
  get_projects,
  get_domains,
  get_certifications,
  get_upcoming_deadlines,
  get_academic_status,
  search_knowledge,
  generate_weekly_review,
  recommend_next_action,
  process_inbox_item,
  create_task,
  create_life_event
} from '@/lib/ai/tools'

// Rate limit helper (Simple Memory Store for basic reliability check)
const ipCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30    // 30 requests

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const clientIp = req.headers.get('x-forwarded-for') || 'global'
    const now = Date.now()
    const rateData = ipCache.get(clientIp)
    
    if (rateData && now < rateData.resetTime) {
      if (rateData.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests. Please try again after a minute.' 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      rateData.count++
    } else {
      ipCache.set(clientIp, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      })
    }

    // 2. Input Validation
    let body
    try {
      body = await req.json()
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: 'Malformed JSON payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { messages } = body
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid parameter: "messages" must be an array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 3. API Key Validation
    if (!process.env.GROQ_API_KEY) {
      console.error('Server Configuration Error: GROQ_API_KEY is not defined.')
      return new Response(JSON.stringify({ error: 'LLM Service is not configured on the server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Convert client messages to model messages
    const modelMessages = await convertToModelMessages(messages)

    // Fetch User Context
    const supabase = await createClient()
    let userId = null
    try {
      userId = await getCurrentUserId()
    } catch (e) {
      console.warn('Could not retrieve active session user', e)
    }

    let user = null
    if (userId) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      user = data
    }

    // Generate strict system prompt
    const systemPrompt = generateSystemPrompt(user)

    // 4. Timeout Race (Timeout after 20 seconds)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('LLM Response Timeout')), 20000)
    )

    const streamPromise = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      tools: {
        get_today_focus,
        get_projects,
        get_domains,
        get_certifications,
        get_upcoming_deadlines,
        get_academic_status,
        search_knowledge,
        generate_weekly_review,
        recommend_next_action,
        process_inbox_item,
        create_task,
        create_life_event
      } as any
    })

    const result = await Promise.race([streamPromise, timeoutPromise])

    return result.toUIMessageStreamResponse()
  } catch (err: any) {
    console.error('Chat API Error:', err.message || err)
    const status = err.message === 'LLM Response Timeout' ? 504 : 500
    return new Response(JSON.stringify({ 
      error: err.message || 'An unexpected error occurred during chat stream processing.' 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
