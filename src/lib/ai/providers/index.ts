import { ProviderInterface } from '../types'
import { GroqProvider } from './groq'
import { aiConfig } from '../config'

class ProviderRegistry {
  private providers: Map<string, ProviderInterface> = new Map()

  constructor() {
    // Groq is the only wired LLM provider. Additional providers (OpenAI, Claude,
    // Gemini) can be added here as real ProviderInterface implementations guarded
    // by their API keys — no stub responders.
    this.register(new GroqProvider())
  }

  register(provider: ProviderInterface) {
    this.providers.set(provider.id, provider)
  }

  get(id: string): ProviderInterface | undefined {
    return this.providers.get(id) ?? this.providers.get(aiConfig.defaultProvider)
  }
}

export const providerRegistry = new ProviderRegistry()
