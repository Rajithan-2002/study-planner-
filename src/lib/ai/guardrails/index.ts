export class AIGuardrails {
  static sanitizeInput(query: string): string {
    // Basic protection against prompt injection attempts
    let clean = query.replace(/(ignore previous instructions|ignore system prompt|system override)/gi, '')
    return clean.trim()
  }

  static checkToolPermission(toolName: string, params: any): { allowed: boolean; reason?: string } {
    const dangerousPrefixes = ['delete', 'remove', 'destroy', 'clear']
    const nameLower = toolName.toLowerCase()

    // Check if the tool implies a deletion or destructive mutation
    const isDestructive = dangerousPrefixes.some(prefix => nameLower.includes(prefix))

    if (isDestructive) {
      return {
        allowed: false,
        reason: `Destructive actions like "${toolName}" require explicit user confirmation card clicks in the UI.`
      }
    }

    return { allowed: true }
  }
}
