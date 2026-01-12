import { useNavigate } from 'react-router-dom'
import {
  Play,
  Pause,
  Square,
  Archive,
  Trash2,
  MessageSquare,
  Eye,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Job } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

interface JobCardProps {
  job: Job
  onAction: (jobId: string, action: string) => void
}

export function JobCard({ job, onAction }: JobCardProps) {
  const navigate = useNavigate()

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
      case 'paused':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
      case 'stopped':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
      case 'archived':
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      default:
        return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    }
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'active':
        return <Badge className="bg-green-500">🟢 Activo</Badge>
      case 'paused':
        return <Badge className="bg-yellow-500">⏸️ Pausado</Badge>
      case 'stopped':
        return <Badge className="bg-blue-500">⏹️ Detenido</Badge>
      case 'archived':
        return <Badge className="bg-gray-500">📦 Archivado</Badge>
      case 'error':
        return <Badge className="bg-red-500">❌ Error</Badge>
      default:
        return <Badge>{state}</Badge>
    }
  }

  const renderActions = () => {
    const commonActions = (
      <>
        {job.state !== 'archived' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onAction(job.id, 'delete')
            }}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </>
    )

    switch (job.state) {
      case 'created':
        return (
          <>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'start')
              }}
            >
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
            {commonActions}
          </>
        )

      case 'active':
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'pause')
              }}
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'stop')
              }}
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          </>
        )

      case 'paused':
        return (
          <>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'resume')
              }}
            >
              <Play className="h-4 w-4" />
              Reanudar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'stop')
              }}
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          </>
        )

      case 'stopped':
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'resume')
              }}
            >
              <Play className="h-4 w-4" />
              Reanudar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'archive')
              }}
            >
              <Archive className="h-4 w-4" />
              Archivar
            </Button>
            {commonActions}
          </>
        )

      case 'archived':
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'reopen')
              }}
            >
              <FolderOpen className="h-4 w-4" />
              Reabrir
            </Button>
            {commonActions}
          </>
        )

      case 'error':
        return (
          <>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'retry')
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onAction(job.id, 'discard')
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${getStateColor(job.state)}`}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-4">
        {/* Header con estado y nombre */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {job.name || job.work_dir.split('/').pop() || 'Trabajo sin nombre'}
            </h3>
            {job.description && (
              <p className="text-xs text-muted-foreground">{job.description}</p>
            )}
          </div>
          {getStateBadge(job.state)}
        </div>

        {/* Información del trabajo */}
        <div className="mb-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Directorio:</span>
            <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">
              {job.work_dir}
            </code>
          </div>
          <div className="flex gap-4">
            <span>Tipo: <strong>{job.type === 'claude' ? 'Claude' : 'Terminal'}</strong></span>
            {job.model && <span>Modelo: <strong>{job.model}</strong></span>}
          </div>
          <div className="flex gap-4">
            <span>Creado: {formatRelativeTime(job.created_at)}</span>
            {job.started_at && <span>Iniciado: {formatRelativeTime(job.started_at)}</span>}
          </div>
        </div>

        {/* Métricas de conversación */}
        {job.message_count > 0 && (
          <div className="mb-3 flex gap-4 rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/5">
            <span>💬 {job.message_count} mensajes</span>
            <span>👤 {job.user_messages} usuario</span>
            <span>🤖 {job.assistant_messages} asistente</span>
          </div>
        )}

        {/* Información en vivo (si activo) */}
        {job.state === 'active' && job.clients !== undefined && (
          <div className="mb-3 rounded bg-green-100 px-2 py-1 text-xs dark:bg-green-900">
            <span className="animate-pulse">● En vivo · {job.clients} cliente(s)</span>
          </div>
        )}

        {/* Información de pausa */}
        {job.state === 'paused' && job.paused_at && (
          <div className="mb-3 rounded bg-yellow-100 px-2 py-1 text-xs dark:bg-yellow-900">
            Pausado desde {formatRelativeTime(job.paused_at)} ({job.pause_count} pausa{job.pause_count !== 1 ? 's' : ''})
          </div>
        )}

        {/* Información de error */}
        {job.state === 'error' && job.error && (
          <div className="mb-3 rounded bg-red-100 px-2 py-1 text-xs dark:bg-red-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{job.error.code}</div>
                <div className="text-red-700 dark:text-red-300">{job.error.message}</div>
                {job.error.retry_count > 0 && (
                  <div className="text-red-600 dark:text-red-400">
                    Intentos fallidos: {job.error.retry_count}/3
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {job.state !== 'created' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/jobs/${job.id}`)
              }}
            >
              {job.state === 'archived' ? (
                <>
                  <Eye className="h-4 w-4" />
                  Ver
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Ver Conversación
                </>
              )}
            </Button>
          )}
          {renderActions()}
        </div>
      </CardContent>
    </Card>
  )
}
