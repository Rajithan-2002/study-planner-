export const aiConfig = {
  defaultProvider: 'groq',
  defaultModel: 'llama-3.3-70b-versatile',
  temperature: 0.2,
  maxTokens: 2048,
  timeoutMs: 15000,
  retryAttempts: 2,
  contextBudgets: {
    academic: 0.15,
    projects: 0.20,
    knowledge: 0.50,
    memory: 0.15
  }
}
