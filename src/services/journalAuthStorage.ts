const JOURNAL_AUTH_TOKEN_KEY = 'unimat.journal.auth.token'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function getJournalAuthToken(): string | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  const token = storage.getItem(JOURNAL_AUTH_TOKEN_KEY)
  return token?.trim() || null
}

export function setJournalAuthToken(token: string): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  const normalizedToken = token.trim()
  if (!normalizedToken) {
    storage.removeItem(JOURNAL_AUTH_TOKEN_KEY)
    return
  }

  storage.setItem(JOURNAL_AUTH_TOKEN_KEY, normalizedToken)
}

export function clearJournalAuthToken(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.removeItem(JOURNAL_AUTH_TOKEN_KEY)
}
