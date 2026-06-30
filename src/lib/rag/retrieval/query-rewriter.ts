export class QueryRewriter {
  static rewrite(query: string): string[] {
    const q = query.trim().toLowerCase()
    const expanded: string[] = [query]

    if (q.includes('networking') || q.includes('ccna')) {
      expanded.push('CCNA Computer Networks OSI TCP/IP routing switching')
    }
    if (q.includes('security')) {
      expanded.push('Security+ cybersecurity encryption firewall vulnerability')
    }
    if (q.includes('gpa') || q.includes('grade')) {
      expanded.push('semester GPA academic performance credit modules marks')
    }

    return Array.from(new Set(expanded))
  }
}
