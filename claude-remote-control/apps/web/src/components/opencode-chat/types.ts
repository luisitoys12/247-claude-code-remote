export type Provider = 'openrouter' | 'ollama'

export interface ModelOption {
  id: string
  label: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  provider?: Provider
  model?: string
  error?: boolean
}

export interface ChatSettings {
  provider: Provider
  model: string
  ollamaBaseUrl: string
  systemPrompt: string
  temperature: number
}

export const DEFAULT_SETTINGS: ChatSettings = {
  provider: 'openrouter',
  model: 'qwen/qwen3-235b-a22b:free',
  ollamaBaseUrl: 'http://localhost:11434',
  systemPrompt:
    'You are a helpful AI coding assistant integrated with a 24/7 remote Claude Code server. ' +
    'Help the user with code, architecture decisions, debugging, and technical questions. ' +
    'Be concise and precise. Use markdown for code blocks.',
  temperature: 0.7,
}
