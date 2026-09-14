import { API_BASE_URL } from './client'

export interface SpeechTranscriptionResponse {
  text: string
}

export class SpeechTranscriptionError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SpeechTranscriptionError'
    this.status = status
  }
}

export async function transcribeSpeech(audio: Blob, language: string) {
  const formData = new FormData()
  formData.append('language', language)
  formData.append('audio', audio, `speech.${audio.type.includes('mp4') ? 'mp4' : 'webm'}`)

  const response = await fetch(`${API_BASE_URL}/speech/transcriptions`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = typeof payload?.detail === 'string' ? payload.detail : `Speech transcription failed: ${response.status}`
    throw new SpeechTranscriptionError(message, response.status)
  }

  return response.json() as Promise<SpeechTranscriptionResponse>
}

export function speechRealtimeUrl() {
  const apiUrl = new URL(API_BASE_URL, window.location.href)
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, '')}/speech/realtime`
  apiUrl.search = ''
  return apiUrl.toString()
}
