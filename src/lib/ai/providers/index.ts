import { ProviderInterface } from '../types'
import { GroqProvider } from './groq'

class ProviderRegistry {
  private providers: Map<string, ProviderInterface> = new Map()

  constructor() {
    // Register active Groq provider
    this.register(new GroqProvider())

    // Register future stubs (can be extended in Sprint 4B/4C)
    this.register({
      id: 'openai',
      generateResponse: async () => ({ answer: 'OpenAI stub responder active.' })
    })

    this.register({
      id: 'claude',
      generateResponse: async () => ({ answer: 'Claude stub responder active.' })
    })

    this.register({
      id: 'gemini',
      generateResponse: async () => ({ answer: 'Gemini stub responder active.' })
    })
  }

  register(provider: ProviderInterface) {
    this.providers.set(provider.id, provider)
  }

  get(id: string): ProviderInterface | undefined {
    return this.providers.get(id)
  }
}

export const providerRegistry = new ProviderRegistry()
