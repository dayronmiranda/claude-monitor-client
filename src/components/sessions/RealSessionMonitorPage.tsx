import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  User,
  Bot,
  RefreshCw,
  Radio,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import type { SessionMessage } from '@/types'

export function RealSessionMonitorPage() {
  const { projectPath, sessionId } = useParams<{ projectPath: string; sessionId: string }>()
  const navigate = useNavigate()
  const { getClient } = useStore()

  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [lastLineIndex, setLastLineIndex] = useState(0)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const client = getClient()
  const decodedPath = projectPath ? decodeURIComponent(projectPath) : ''

  // Función de polling
  const pollMessages = async () => {
    if (!client || !decodedPath || !sessionId || !isMonitoring) return

    try {
      const res = await client.makeRequest(
        `GET /api/projects/${encodeURIComponent(decodedPath)}/sessions/${sessionId}/messages/realtime?from=${lastLineIndex}`
      )

      if (res.success && res.data) {
        const newMessages = res.data as SessionMessage[]
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages])
          setLastLineIndex(prev => prev + newMessages.length)
          setUpdateCount(prev => prev + 1)
          setLastUpdate(new Date())
        }
      }
    } catch (err) {
      console.error('Error polling messages:', err)
    }
  }

  // Inicializar y hacer polling
  useEffect(() => {
    if (!isMonitoring) return

    // Cargar mensajes iniciales
    const loadInitial = async () => {
      if (!client || !decodedPath || !sessionId) return
      try {
        const res = await client.getSessionMessages(decodedPath, sessionId)
        if (res.success && res.data) {
          setMessages(res.data as SessionMessage[])
          setLastLineIndex(res.data.length)
          setLastUpdate(new Date())
        }
      } catch (err) {
        console.error('Error loading initial messages:', err)
      }
    }

    loadInitial()

    // Configurar polling cada 500ms
    pollIntervalRef.current = setInterval(() => {
      pollMessages()
    }, 500)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [client, decodedPath, sessionId, isMonitoring])

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[hsl(var(--secondary))] p-4 sm:p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Real Session Monitor</h1>
            {isMonitoring && (
              <div className="flex items-center gap-1 text-green-500">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-semibold">EN VIVO</span>
              </div>
            )}
          </div>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {messages.length} mensajes · Actualizaciones: {updateCount}
            {lastUpdate && ` · Última actualización: ${lastUpdate.toLocaleTimeString()}`}
          </div>
        </div>

        <Button
          onClick={toggleMonitoring}
          variant={isMonitoring ? 'default' : 'outline'}
          size="sm"
          className="flex-shrink-0"
        >
          {isMonitoring ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Monitoreando
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Pausado
            </>
          )}
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-12 w-12 mb-4 animate-spin" />
            <p>Esperando mensajes...</p>
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
                <p className={`text-xs mt-3 opacity-70 ${
                  msg.type === 'user' ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
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

      {/* Status Bar */}
      {isMonitoring && (
        <div className="border-t border-[hsl(var(--secondary))] p-4 bg-[hsl(var(--secondary))]/50">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Monitoreando en tiempo real (polling cada 500ms)
          </div>
        </div>
      )}
    </div>
  )
}
