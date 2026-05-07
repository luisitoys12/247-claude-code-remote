'use client'
import { useState, useEffect } from 'react'

// ── Modelos OpenRouter (todos free o pay-per-token, sin Anthropic) ──
const OPENROUTER_MODELS = [
  // Qwen3
  { id: 'qwen/qwen3-235b-a22b:free',          name: 'Qwen3 235B (free)' },
  { id: 'qwen/qwen3-30b-a3b:free',             name: 'Qwen3 30B (free)' },
  { id: 'qwen/qwen3-14b:free',                 name: 'Qwen3 14B (free)' },
  { id: 'qwen/qwen3-8b:free',                  name: 'Qwen3 8B (free)' },
  // DeepSeek
  { id: 'deepseek/deepseek-r1:free',           name: 'DeepSeek R1 (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 (free)' },
  // Meta Llama
  { id: 'meta-llama/llama-4-scout:free',       name: 'Llama 4 Scout (free)' },
  { id: 'meta-llama/llama-4-maverick:free',    name: 'Llama 4 Maverick (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (free)' },
  // Nvidia
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: 'Nemotron 70B (free)' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', name: 'Nemotron Super 49B (free)' },
  // Google
  { id: 'google/gemma-3-27b-it:free',          name: 'Gemma 3 27B (free)' },
  // Mistral
  { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small 3.2 (free)' },
  { id: 'mistralai/devstral-small:free',       name: 'Devstral Small (free)' },
  // Microsoft
  { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Phi-4 Reasoning+ (free)' },
]

type OllamaModel = { id: string; name: string; size?: string }

interface Props {
  provider:     'openrouter' | 'ollama'
  model:        string
  onProvider:   (p: 'openrouter' | 'ollama') => void
  onModel:      (m: string) => void
  disabled?:    boolean
}

export default function ModelSelector({ provider, model, onProvider, onModel, disabled }: Props) {
  const [ollamaModels, setOllamaModels]   = useState<OllamaModel[]>([])
  const [ollamaStatus, setOllamaStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [ollamaError,  setOllamaError]    = useState('')

  const fetchOllamaModels = async () => {
    setOllamaStatus('loading')
    setOllamaError('')
    try {
      const res  = await fetch('/api/opencode/ollama-models')
      const data = await res.json()
      if (data.error && !data.models?.length) {
        setOllamaError(data.error)
        setOllamaStatus('error')
      } else {
        setOllamaModels(data.models ?? [])
        setOllamaStatus('ok')
        if (data.models?.length && !data.models.find((m: OllamaModel) => m.id === model)) {
          onModel(data.models[0].id)
        }
      }
    } catch (e) {
      setOllamaError('No se pudo conectar con el servidor')
      setOllamaStatus('error')
    }
  }

  useEffect(() => {
    if (provider === 'ollama') fetchOllamaModels()
    else onModel(OPENROUTER_MODELS[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* ── Toggle proveedor ── */}
      <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-sm font-medium">
        {(['openrouter', 'ollama'] as const).map(p => (
          <button
            key={p}
            disabled={disabled}
            onClick={() => onProvider(p)}
            className={`px-3 py-1.5 transition-colors ${
              provider === p
                ? 'bg-teal-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {p === 'openrouter' ? '🌐 OpenRouter' : '🧠 Ollama'}
          </button>
        ))}
      </div>

      {/* ── Selector de modelo ── */}
      {provider === 'openrouter' && (
        <select
          value={model}
          onChange={e => onModel(e.target.value)}
          disabled={disabled}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {OPENROUTER_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {provider === 'ollama' && (
        <div className="flex items-center gap-1.5">
          {ollamaStatus === 'loading' && (
            <span className="text-xs text-zinc-500 animate-pulse">Detectando modelos…</span>
          )}
          {ollamaStatus === 'error' && (
            <>
              <span className="text-xs text-red-400 max-w-[200px] truncate" title={ollamaError}>
                ⚠️ {ollamaError}
              </span>
              <button
                onClick={fetchOllamaModels}
                className="text-xs text-teal-400 hover:underline"
              >Reintentar</button>
            </>
          )}
          {ollamaStatus === 'ok' && ollamaModels.length === 0 && (
            <span className="text-xs text-zinc-500">No hay modelos instalados en Ollama</span>
          )}
          {ollamaStatus === 'ok' && ollamaModels.length > 0 && (
            <select
              value={model}
              onChange={e => onModel(e.target.value)}
              disabled={disabled}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {ollamaModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.size ? ` (${m.size})` : ''}
                </option>
              ))}
            </select>
          )}
          {(ollamaStatus === 'ok' || ollamaStatus === 'error') && (
            <button
              onClick={fetchOllamaModels}
              title="Refrescar modelos"
              className="text-zinc-500 hover:text-zinc-300 text-base leading-none"
            >🔄</button>
          )}
        </div>
      )}
    </div>
  )
}
