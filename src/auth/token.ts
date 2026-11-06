/** Token e id de visitante em localStorage. Falha de storage nunca quebra a página: vira "sem sessão". */
const TOKEN_KEY = 'kurio:token'
const GUEST_KEY = 'kurio:guest-id'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sem storage: a sessão dura até o refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ver `setToken`
  }
}

/** Id estável do carrinho de visitante (header `X-Guest-Id`, fundido no login e no cadastro). */
export function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(GUEST_KEY, created)
    return created
  } catch {
    return memoryGuestId
  }
}
const memoryGuestId = crypto.randomUUID()
