import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Archive,
  Trash2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { JobsClient } from '@/services/jobsClient'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Job } from '@/types'
import { formatRelativeTime, formatDate } from '@/lib/utils'

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { getClient, getActiveHost } = useStore()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const client = getClient()
  const activeHost = getActiveHost()
  const projectPath = activeHost?.id || ''
  const jobsClient = client ? new JobsClient(client) : null

  const loadJob = async () => {
    if (!jobsClient || !projectPath || !jobId) return
    setLoading(true)
    setError(null)
    try {
      const data = await jobsClient.getJob(projectPath, jobId)
      setJob(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando trabajo'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJob()
  }, [jobsClient, projectPath, jobId])

  const handleAction = async (action: string) => {
    if (!jobsClient || !projectPath || !jobId) return
    setActionLoading(true)
    try {
      switch (action) {
        case 'start':
          await jobsClient.startJob(projectPath, jobId)
          break
        case 'pause':
          await jobsClient.pauseJob(projectPath, jobId)
          break
        case 'resume':
          await jobsClient.resumeJob(projectPath, jobId)
          break
        case 'stop':
          await jobsClient.stopJob(projectPath, jobId)
          break
        case 'archive':
          await jobsClient.archiveJob(projectPath, jobId)
          break
        case 'delete':
          if (window.confirm('¿Estás seguro de que deseas eliminar este trabajo?')) {
            await jobsClient.deleteJob(projectPath, jobId)
            navigate('/jobs')
            return
          }
          break
        case 'retry':
          await jobsClient.retryJob(projectPath, jobId)
          break
      }
      loadJob()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Error en acción ${action}`
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'stopped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Cargando trabajo...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Trabajo no encontrado</h3>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Trabajos
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{job.name || job.work_dir}</h1>
            {job.description && <p className="text-muted-foreground">{job.description}</p>}
          </div>
          <Badge className={`${getStateColor(job.state)} text-sm`}>{job.state.toUpperCase()}</Badge>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Main Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Job Info */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium">Directorio</dt>
                  <dd className="font-mono text-sm text-muted-foreground">{job.work_dir}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium">Tipo</dt>
                  <dd>{job.type === 'claude' ? 'Claude' : 'Terminal Bash'}</dd>
                </div>
                {job.model && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="font-medium">Modelo</dt>
                    <dd>{job.model}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium">Estado</dt>
                  <dd className="capitalize">{job.state}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="font-medium">Creado</dt>
                  <dd>
                    <div className="text-sm">{formatDate(job.created_at)}</div>
                    <div className="text-xs text-muted-foreground">{formatRelativeTime(job.created_at)}</div>
                  </dd>
                </div>
                {job.started_at && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="font-medium">Iniciado</dt>
                    <dd>
                      <div className="text-sm">{formatDate(job.started_at)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(job.started_at)}</div>
                    </dd>
                  </div>
                )}
                {job.stopped_at && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="font-medium">Detenido</dt>
                    <dd>
                      <div className="text-sm">{formatDate(job.stopped_at)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(job.stopped_at)}</div>
                    </dd>
                  </div>
                )}
                {job.archived_at && (
                  <div className="flex justify-between pb-2">
                    <dt className="font-medium">Archivado</dt>
                    <dd>
                      <div className="text-sm">{formatDate(job.archived_at)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(job.archived_at)}</div>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Métricas de Conversación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-xs text-muted-foreground">Total de Mensajes</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{job.message_count}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                  <p className="text-xs text-muted-foreground">Mensajes del Usuario</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{job.user_messages}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
                  <p className="text-xs text-muted-foreground">Respuestas de Claude</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{job.assistant_messages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Indicators */}
          {job.state === 'active' && (
            <Card className="mt-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">En vivo</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{job.clients || 0} cliente(s) conectado(s)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {job.error && (
            <Card className="mt-6 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Código</dt>
                    <dd className="font-mono text-sm">{job.error.code}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Mensaje</dt>
                    <dd className="text-sm">{job.error.message}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Intentos Fallidos</dt>
                    <dd>{job.error.retry_count}/3</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Actions & Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.state === 'created' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleAction('start')}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4" />
                    Iniciar
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              )}

              {job.state === 'active' && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction('pause')}
                    disabled={actionLoading}
                  >
                    <Pause className="h-4 w-4" />
                    Pausar
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleAction('stop')}
                    disabled={actionLoading}
                  >
                    <Square className="h-4 w-4" />
                    Detener
                  </Button>
                </>
              )}

              {job.state === 'paused' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleAction('resume')}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4" />
                    Reanudar
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction('stop')}
                    disabled={actionLoading}
                  >
                    <Square className="h-4 w-4" />
                    Detener
                  </Button>
                </>
              )}

              {job.state === 'stopped' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleAction('resume')}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4" />
                    Reanudar
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction('archive')}
                    disabled={actionLoading}
                  >
                    <Archive className="h-4 w-4" />
                    Archivar
                  </Button>
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              )}

              {job.state === 'archived' && (
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => handleAction('delete')}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}

              {job.state === 'error' && (
                <>
                  {job.error && job.error.retry_count < 3 && (
                    <Button
                      className="w-full"
                      onClick={() => handleAction('retry')}
                      disabled={actionLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reintentar
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Descartar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lifecycle Summary */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Ciclo de Vida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pausas</span>
                <span className="font-medium">{job.pause_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Reanudaciones</span>
                <span className="font-medium">{job.resume_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
