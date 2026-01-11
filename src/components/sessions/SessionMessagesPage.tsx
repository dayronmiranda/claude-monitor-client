import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  User,
  Bot,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { SessionMessage } from '@/types'

export function SessionMessagesPage() {
  const { projectPath, sessionId } = useParams<{ projectPath: string; sessionId: string }>()
  const navigate = useNavigate()
  const { getClient } = useStore()

  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const client = getClient()
  const decodedPath = projectPath ? decodeURIComponent(projectPath) : ''

  useEffect(() => {
    loadMessages()
  }, [client, decodedPath, sessionId])

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos mensajes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!client || !decodedPath || !sessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await client.getSessionMessages(decodedPath, sessionId)
      if (res.success && res.data) {
        setMessages(res.data)
      } else {
        setError('No se pudieron cargar los mensajes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[hsl(var(--secondary))] p-4 sm:p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Historial de Chat</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {messages.length} mensajes
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <Button onClick={loadMessages}>Reintentar</Button>
            </CardContent>
          </Card>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <p>No hay mensajes en esta sesión</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  msg.type === 'user'
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--secondary))]'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm break-words leading-relaxed">
                  {msg.content}
                </pre>
                {msg.todos && msg.todos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-opacity-30 border-white">
                    <p className="text-xs font-semibold mb-2">📋 TODOs:</p>
                    <ul className="text-xs space-y-1">
                      {msg.todos.map((todo, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{typeof todo === 'string' ? todo : JSON.stringify(todo)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {msg.timestamp && (
                  <p className={`text-xs mt-3 opacity-70 ${
                    msg.type === 'user' ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              {msg.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
