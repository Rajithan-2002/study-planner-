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
      console.warn('GROQ_API_KEY is missing — returning a degraded response.')
      return this.degradedResponse('not_configured')
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
      console.error('Groq Provider execution error:', err)
      return this.degradedResponse('error')
    }
  }

  private degradedResponse(reason: 'not_configured' | 'error'): { answer: string } {
    const answer = reason === 'not_configured'
      ? 'The AI assistant is not configured on this server (no LLM API key). Your request was not processed. Structured commands that create or update items still work, but conversational answers are unavailable until an API key is set.'
      : 'The AI service is temporarily unavailable, so I could not generate a response. Please try again in a moment.'
    return { answer }
  }
}
