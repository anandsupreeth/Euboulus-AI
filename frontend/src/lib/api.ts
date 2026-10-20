import axios, { type InternalAxiosRequestConfig } from 'axios'

export type InterviewTopic = 'DSA' | 'System Design' | 'Java' | 'React' | 'Python' | 'Behavioral'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface InterviewFeedback {
  technical_score: number
  communication_score: number
  confidence_score: number
  strengths: string[]
  improvements: string[]
  is_demo: boolean
}

export interface InterviewRecord {
  id: string
  created_at: string
  topic: InterviewTopic
  difficulty: Difficulty
  transcript: string
  duration_seconds: number
  feedback: InterviewFeedback
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export interface AuthResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: { id: string; full_name: string; email: string }
}

let accessToken: string | null = null
let refreshRequest: Promise<AuthResponse> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

// Who is signed in, observable by React (see useAuth). `ready` flips to true once the first
// refresh attempt has finished, so pages can tell "not signed in" from "still checking".
export interface AuthSnapshot {
  user: AuthResponse['user'] | null
  ready: boolean
}
let authSnapshot: AuthSnapshot = { user: null, ready: false }
const authListeners = new Set<() => void>()

function setAuth(next: AuthSnapshot) {
  authSnapshot = next
  authListeners.forEach((listener) => listener())
}

export function subscribeAuth(listener: () => void): () => void {
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

export function getAuthSnapshot(): AuthSnapshot {
  return authSnapshot
}

export async function refreshAuthSession(): Promise<AuthResponse> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.access_token)
        setAuth({ user: data.user, ready: true })
        return data
      })
      .catch((error: unknown) => {
        setAccessToken(null)
        setAuth({ user: null, ready: true })
        throw error
      })
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    return Promise.reject(error)
  }

  const request = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
  if (request._retried || request.url?.startsWith('/auth/')) return Promise.reject(error)

  request._retried = true
  try {
    const session = await refreshAuthSession()
    request.headers.Authorization = `Bearer ${session.access_token}`
    return api(request)
  } catch {
    setAccessToken(null)
    setAuth({ user: null, ready: true })
    return Promise.reject(error)
  }
})

export default api

export async function registerAccount(payload: {
  full_name: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload, { withCredentials: true })
  setAccessToken(data.access_token)
  setAuth({ user: data.user, ready: true })
  return data
}

export async function loginAccount(payload: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload, { withCredentials: true })
  setAccessToken(data.access_token)
  setAuth({ user: data.user, ready: true })
  return data
}

export async function updateProfile(payload: { full_name: string }): Promise<AuthResponse['user']> {
  const { data } = await api.patch<AuthResponse['user']>('/account/profile', payload)
  // Publish the new name so the sidebar, header and profile all update without a reload.
  setAuth({ user: data, ready: true })
  return data
}

export async function logoutAccount(): Promise<void> {
  try {
    await api.post('/auth/logout', {}, { withCredentials: true })
  } finally {
    setAccessToken(null)
    setAuth({ user: null, ready: true })
  }
}

export async function getInterviews(): Promise<InterviewRecord[]> {
  const response = await api.get<InterviewRecord[]>('/interviews')
  return response.data
}

export interface TopicSuggestion {
  topic: string
  subtopic: string
}

export interface AnswerEvaluation {
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
}

export interface VoiceTurn {
  index: number
  question_text: string
  question_audio: string | null
  answer_text: string
  answer_audio: string | null
  answer_duration_seconds: number
  evaluation: AnswerEvaluation | null
}

export interface VoiceFeedback {
  summary: string
  strengths: string[]
  improvements: string[]
  overall_score: number
}

export interface VoiceSession {
  id: string
  created_at: string
  topic: string
  subtopic: string
  subject_slug: string | null
  topic_slug: string | null
  difficulty: Difficulty
  status: 'active' | 'completed'
  turns: VoiceTurn[]
  feedback: VoiceFeedback | null
  closing_audio: string | null
}

// Voice calls wait on several OpenAI requests, so allow more than the default.
const VOICE_TIMEOUT_MS = 120_000

// Audio routes need the Authorization header, which <audio src> can't send, so the file is
// fetched with the API client and played from an object URL (cached per file).
const audioUrls = new Map<string, Promise<string>>()

export function fetchAudioObjectUrl(sessionId: string, name: string): Promise<string> {
  const key = `${sessionId}/${name}`
  let url = audioUrls.get(key)
  if (!url) {
    url = api
      .get<Blob>(`/voice/sessions/${sessionId}/audio/${name}`, { responseType: 'blob' })
      .then(({ data }) => URL.createObjectURL(data))
    url.catch(() => audioUrls.delete(key))
    audioUrls.set(key, url)
  }
  return url
}

export interface Progress {
  attempts: number
  average_score: number | null
  best_score: number | null
  last_practiced: string | null
}

export interface TopicProgress extends Progress {
  slug: string
  name: string
}

export interface SubjectSummary extends Progress {
  slug: string
  name: string
  category: string
  description: string
  topic_count: number
}

export interface SubjectDetail extends SubjectSummary {
  topics: TopicProgress[]
}

export interface CatalogOverview {
  total_attempts: number
  average_score: number | null
  categories: { category: string; subjects: SubjectSummary[] }[]
}

export interface Attempt {
  id: string
  session_id: string
  created_at: string
  difficulty: Difficulty
  question_text: string
  answer_text: string
  question_audio: string | null
  answer_audio: string | null
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
}

export interface TopicSummary {
  attempt_count: number
  average_score: number | null
  summary: string
  top_improvements: string[]
  generated_at: string | null
}

export async function getCatalogOverview(): Promise<CatalogOverview> {
  const { data } = await api.get<CatalogOverview>('/subjects')
  return data
}

export async function getSubject(slug: string): Promise<SubjectDetail> {
  const { data } = await api.get<SubjectDetail>(`/subjects/${slug}`)
  return data
}

export async function resetSubjectProgress(slug: string): Promise<{ answers_deleted: number; sessions_deleted: number }> {
  const { data } = await api.delete(`/subjects/${slug}/progress`)
  return data
}

export async function getTopicAttempts(subject: string, topic: string): Promise<Attempt[]> {
  const { data } = await api.get<Attempt[]>(`/subjects/${subject}/topics/${topic}/attempts`)
  return data
}

export async function getTopicSummary(subject: string, topic: string): Promise<TopicSummary> {
  const { data } = await api.get<TopicSummary>(`/subjects/${subject}/topics/${topic}/summary`, {
    timeout: 60_000,
  })
  return data
}

export async function getTopicSuggestions(hint = ''): Promise<TopicSuggestion[]> {
  const { data } = await api.get<TopicSuggestion[]>('/voice/suggestions', { params: { hint } })
  return data
}

export async function startVoiceSession(
  payload:
    | { subject_slug: string; topic_slug: string; difficulty: Difficulty }
    | { topic: string; subtopic: string; difficulty: Difficulty },
): Promise<VoiceSession> {
  const { data } = await api.post<VoiceSession>('/voice/sessions', payload, { timeout: VOICE_TIMEOUT_MS })
  return data
}

export async function submitVoiceAnswer(
  sessionId: string,
  audio: Blob,
  durationSeconds: number,
): Promise<VoiceSession> {
  const form = new FormData()
  form.append('audio', audio, 'answer.wav')
  form.append('duration_seconds', String(durationSeconds))
  const { data } = await api.post<VoiceSession>(`/voice/sessions/${sessionId}/answer`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: VOICE_TIMEOUT_MS,
  })
  return data
}

export async function finishVoiceSession(sessionId: string): Promise<VoiceSession> {
  const { data } = await api.post<VoiceSession>(`/voice/sessions/${sessionId}/finish`, {}, { timeout: VOICE_TIMEOUT_MS })
  return data
}

export async function getVoiceSessions(): Promise<VoiceSession[]> {
  const { data } = await api.get<VoiceSession[]>('/voice/sessions')
  return data
}

export async function createInterview(
  interview: Pick<InterviewRecord, 'topic' | 'difficulty' | 'transcript' | 'duration_seconds'>,
): Promise<InterviewRecord> {
  const response = await api.post<InterviewRecord>('/interviews', interview)
  return response.data
}
