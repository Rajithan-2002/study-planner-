export class AIGuardrails {
  static sanitizeInput(query: string): string {
    // Basic protection against prompt injection attempts
    const clean = query.replace(/(ignore previous instructions|ignore system prompt|system override)/gi, '')
    return clean.trim()
  }
}
