import type { ModelOption } from './types'

export const OPENROUTER_MODELS: ModelOption[] = [
  { id: 'qwen/qwen3-235b-a22b:free',                      label: '🟣 Qwen3 235B (free)' },
  { id: 'qwen/qwen3-30b-a3b:free',                        label: '🟣 Qwen3 30B (free)' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct',               label: '🟣 Qwen2.5 Coder 32B' },
  { id: 'deepseek/deepseek-r1:free',                      label: '🔵 DeepSeek R1 (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',            label: '🔵 DeepSeek V3 Chat (free)' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free',    label: '🟢 Nemotron 70B (free)' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free',    label: '🟢 Nemotron Super 49B (free)' },
  { id: 'meta-llama/llama-4-scout:free',                  label: '🦙 Llama 4 Scout (free)' },
  { id: 'meta-llama/llama-4-maverick:free',               label: '🦙 Llama 4 Maverick (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',         label: '🦙 Llama 3.3 70B (free)' },
  { id: 'google/gemma-3-27b-it:free',                     label: '🔴 Gemma 3 27B (free)' },
  { id: 'google/gemma-3n-e4b-it:free',                    label: '🔴 Gemma 3n E4B (free)' },
  { id: 'mistralai/mistral-small-3.2-24b-instruct:free',  label: '🌀 Mistral Small 3.2 (free)' },
  { id: 'mistralai/devstral-small:free',                  label: '🌀 Devstral Small (free)' },
  { id: 'microsoft/phi-4-reasoning-plus:free',            label: '🔷 Phi-4 Reasoning+ (free)' },
  { id: 'anthropic/claude-sonnet-4-5',                    label: '🤖 Claude Sonnet 4.5' },
  { id: 'openai/gpt-4o-mini',                             label: '⚪ GPT-4o Mini' },
]

export const OLLAMA_MODELS: ModelOption[] = [
  { id: 'qwen2.5-coder:7b',   label: 'Qwen2.5 Coder 7B' },
  { id: 'qwen2.5:14b',        label: 'Qwen2.5 14B' },
  { id: 'qwen3:8b',           label: 'Qwen3 8B' },
  { id: 'deepseek-r1:7b',     label: 'DeepSeek R1 7B' },
  { id: 'deepseek-r1:14b',    label: 'DeepSeek R1 14B' },
  { id: 'deepseek-coder-v2',  label: 'DeepSeek Coder V2' },
  { id: 'llama3.2:3b',        label: 'Llama 3.2 3B' },
  { id: 'llama3.1:8b',        label: 'Llama 3.1 8B' },
  { id: 'mistral:7b',         label: 'Mistral 7B' },
  { id: 'phi4:14b',           label: 'Phi-4 14B' },
  { id: 'phi4-mini:3.8b',     label: 'Phi-4 Mini 3.8B' },
  { id: 'gemma3:9b',          label: 'Gemma 3 9B' },
  { id: 'codellama:13b',      label: 'CodeLlama 13B' },
  { id: 'nemotron-mini:4b',   label: 'Nemotron Mini 4B' },
]
