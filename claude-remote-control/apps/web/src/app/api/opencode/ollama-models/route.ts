import { NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? ''

export async function GET() {
  if (!OLLAMA_BASE_URL) {
    return NextResponse.json(
      { error: 'OLLAMA_BASE_URL no configurado', models: [] },
      { status: 200 } // 200 para no romper el UI, solo muestra lista vacía
    )
  }

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      next: { revalidate: 30 }, // cache 30s
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo conectar a Ollama en ${OLLAMA_BASE_URL}`, models: [] },
        { status: 200 }
      )
    }

    const data = await res.json()
    const models = (data.models ?? []).map((m: { name: string; size: number }) => ({
      id:   m.name,
      name: m.name.replace(/:latest$/, ''),
      size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
    }))

    return NextResponse.json({ models, url: OLLAMA_BASE_URL })
  } catch (e) {
    return NextResponse.json(
      { error: `Error conectando a Ollama: ${(e as Error).message}`, models: [] },
      { status: 200 }
    )
  }
}
