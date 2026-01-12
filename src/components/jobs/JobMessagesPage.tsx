import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, User, Bot, Loader } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { JobsClient } from '@/services/jobsClient'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { Job } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

export function JobMessagesPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { getClient, getActiveHost } = useStore()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])

  const client = getClient()
  const activeHost = getActiveHost()
  const projectPath = activeHost?.id || ''
  const jobsClient = client ? new JobsClient(client) : null

  const loadJobAndMessages = async () => {
    if (!jobsClient || !projectPath || !jobId) return

    setLoading(true)
    setError(null)

    try {
      // Obtener datos del job
      const jobData = await jobsClient.getJob(projectPath, jobId)
      setJob(jobData)

      // Obtener mensajes
      setMessagesLoading(true)
      try {
        const messagesData = await jobsClient.getJobMessages(projectPath, jobId)
        setMessages(messagesData.messages || [])
      } catch (err) {
        console.warn('Error fetching messages:', err)
        // No mostrar error si fallan los mensajes, ya que el job se cargó
      } finally {
        setMessagesLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando trabajo'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobAndMessages()
  }, [jobsClient, projectPath, jobId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Trabajos
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se encontró el trabajo</p>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Detalles
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.name || job.work_dir}</h1>
            <p className="text-sm text-muted-foreground">
              {job.message_count} mensajes · {job.user_messages} usuario · {job.assistant_messages} asistente
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messagesLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.type === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.type === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-purple-100 dark:bg-purple-900'
                  }`}
                >
                  {msg.type === 'user' ? (
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>

                {/* Message */}
                <div className="flex-1">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.type === 'user'
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : 'bg-purple-50 dark:bg-purple-950'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  {msg.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Sin mensajes</h3>
              <p className="text-sm text-muted-foreground">
                Este trabajo aún no tiene conversación
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
