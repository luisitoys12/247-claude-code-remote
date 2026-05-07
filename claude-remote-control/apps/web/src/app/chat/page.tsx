import { OpenCodeChat } from '@/components/opencode-chat'

export const metadata = {
  title: 'OpenCode Chat — Multi-Model AI',
  description: 'Chat with Qwen, DeepSeek, Nemotron, Llama and more via OpenRouter or Ollama',
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[90vh]">
        <OpenCodeChat />
      </div>
    </main>
  )
}
