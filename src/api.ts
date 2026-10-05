export const API_URL = import.meta.env.VITE_API_URL || 'https://api.konsultime.mk'

export type Document = { id: number; client_id: number; original_name: string; content_type: string; size_bytes: number; created_at: string }
export type Client = { id: number; first_name: string; last_name: string; phone: string; created_at: string; documents: Document[] }
export type Appointment = { id: number; client_id: number; starts_at: string; notes: string | null; created_at: string; client: Client }
export type User = { id: number; username: string; is_active: boolean }

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }

async function refresh(): Promise<boolean> {
  if (!refreshPromise) refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async response => {
      if (!response.ok) { accessToken = null; return false }
      accessToken = (await response.json()).access_token
      return true
    }).catch(() => { accessToken = null; return false }).finally(() => { refreshPromise = null })
  return refreshPromise
}

export async function restoreSession() { return refresh() }

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  if (!response.ok) throw new Error(await errorMessage(response))
  accessToken = (await response.json()).access_token
}

export async function logout() {
  try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }) }
  catch { /* Clear the local session even if the network is unavailable. */ }
  finally { accessToken = null }
}

async function errorMessage(response: Response) {
  try { const body = await response.json(); return typeof body.detail === 'string' ? body.detail : 'Kontrollo të dhënat dhe provo përsëri.' }
  catch { return 'Ndodhi një gabim. Provo përsëri.' }
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' })
  if (response.status === 401 && retry && await refresh()) return api<T>(path, options, false)
  if (!response.ok) throw new Error(await errorMessage(response))
  if (response.status === 204) return undefined as T
  return response.json()
}

export async function fetchDocumentBlob(clientId: number, document: Document): Promise<Blob> {
  const headers = new Headers()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  let response = await fetch(`${API_URL}/clients/${clientId}/documents/${document.id}`, { headers, credentials: 'include' })
  if (response.status === 401 && await refresh()) {
    headers.set('Authorization', `Bearer ${accessToken}`)
    response = await fetch(`${API_URL}/clients/${clientId}/documents/${document.id}`, { headers, credentials: 'include' })
  }
  if (!response.ok) throw new Error(await errorMessage(response))
  return new Blob([await response.blob()], { type: document.content_type })
}

export async function downloadDocument(clientId: number, document: Document) {
  const url = URL.createObjectURL(await fetchDocumentBlob(clientId, document))
  const link = window.document.createElement('a')
  link.href = url; link.download = document.original_name; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}
