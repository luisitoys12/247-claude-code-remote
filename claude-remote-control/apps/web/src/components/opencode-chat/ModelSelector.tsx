'use client'

import { useState, useEffect } from 'react'
import type { Provider, ModelOption, ChatSettings } from './types'
import { OPENROUTER_MODELS, OLLAMA_MODELS } from './model-lists'

interface Props {
  settings: ChatSettings
  onChange: (patch: Partial<ChatSettings>) => void
}

export function ModelSelector({ settings, onChange }: Props) {
  const [ollamaLive, setOllamaLive] = useState<ModelOption[]>([])
  const [ollamaLoading, setOllamaLoading] = useState(false)
  const [ollamaError, setOllamaError] = useState<string | null>(null)

  const fetchOllamaModels = async () => {
    setOllamaLoading(true)
    setOllamaError(null)
    try {
      const params = new URLSearchParams()
      if (settings.ollamaBaseUrl) params.set('baseUrl', settings.ollamaBaseUrl)
      const res = await fetch(`/api/opencode/ollama-models?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOllamaLive(data.models ?? [])
    } catch (err) {
      setOllamaError(err instanceof Error ? err.message : 'Cannot reach Ollama')
      setOllamaLive([])
    } finally {
      setOllamaLoading(false)
    }
  }

  useEffect(() => {
    if (settings.provider === 'ollama') fetchOllamaModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider, settings.ollamaBaseUrl])

  const models: ModelOption[] =
    settings.provider === 'openrouter'
      ? OPENROUTER_MODELS
      : ollamaLive.length > 0
      ? ollamaLive
      : OLLAMA_MODELS

  const setProvider = (p: Provider) => {
    const defaultModel =
      p === 'openrouter' ? OPENROUTER_MODELS[0].id : OLLAMA_MODELS[0].id
    onChange({ provider: p, model: defaultModel })
  }

  return (
    <div className="flex flex-col gap-3 p-3 border-b border-zinc-200 dark:border-zinc-700">
      {/* Provider Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mr-1">Provider:</span>
        <button
          onClick={() => setProvider('openrouter')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            settings.provider === 'openrouter'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
          }`}
        >
          OpenRouter
        </button>
        <button
          onClick={() => setProvider('ollama')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            settings.provider === 'ollama'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
          }`}
        >
          Ollama
        </button>
      </div>

      {/* Ollama URL */}
      {settings.provider === 'ollama' && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={settings.ollamaBaseUrl}
            onChange={(e) => onChange({ ollamaBaseUrl: e.target.value })}
            placeholder="http://localhost:11434"
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={fetchOllamaModels}
            disabled={ollamaLoading}
            className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {ollamaLoading ? '⟳' : '↻'}
          </button>
        </div>
      )}

      {/* Model Select */}
      <div className="flex flex-col gap-1">
        <select
          value={settings.model}
          onChange={(e) => onChange({ model: e.target.value })}
          className="w-full text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {ollamaError && settings.provider === 'ollama' && (
          <p className="text-[10px] text-amber-500">
            ⚠ {ollamaError} — showing default models
          </p>
        )}
      </div>
    </div>
  )
}
