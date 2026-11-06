export const UNAVAILABLE_NOTICE = 'Indisponível nesta demonstração.'

/** Primeira mensagem de cada campo de um erro do Zod. */
export function firstIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

/** `fieldErrors` da API (`{ campo: [mensagens] }`) para a primeira mensagem por campo. */
export function fieldErrorsFrom(fieldErrors: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages[0] ?? '']))
}
