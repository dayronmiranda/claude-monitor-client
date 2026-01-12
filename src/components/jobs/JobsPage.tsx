import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Activity,
  Pause,
  Square,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { JobsClient } from '@/services/jobsClient'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { Job, JobState } from '@/types'
import { JobCard } from './JobCard'
import { CreateJobDialog } from './CreateJobDialog'

export function JobsPage() {
  const navigate = useNavigate()
  const { getClient, getActiveHost } = useStore()
  const [searchParams] = useSearchParams()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<JobState | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const client = getClient()
  const activeHost = getActiveHost()
  const projectPath = searchParams.get('project') || activeHost?.id || ''
  const jobsClient = client ? new JobsClient(client) : null

  const loadJobs = async () => {
    if (!jobsClient || !projectPath) return
    setLoading(true)
    setError(null)
    try {
      const data = await jobsClient.getJobs(projectPath)
      setJobs(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando trabajos'
      setError(message)
      console.error('Failed to load jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [jobsClient, projectPath])

  const handleCreateJob = async (config: any) => {
    if (!jobsClient || !projectPath) return
    try {
      await jobsClient.createJob(projectPath, config)
      setShowCreateForm(false)
      loadJobs()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando trabajo'
      setError(message)
      console.error('Failed to create job:', err)
    }
  }

  const handleJobAction = async (jobId: string, action: string) => {
    if (!jobsClient || !projectPath) return
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
        case 'reopen':
          await jobsClient.reopenJob(projectPath, jobId)
          break
        case 'delete':
          await jobsClient.deleteJob(projectPath, jobId)
          break
        case 'retry':
          await jobsClient.retryJob(projectPath, jobId)
          break
        case 'discard':
          await jobsClient.discardJob(projectPath, jobId)
          break
        default:
          console.warn(`Unknown action: ${action}`)
      }
      loadJobs()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Error en acción ${action}`
      setError(message)
      console.error(`Failed to ${action} job:`, err)
    }
  }

  if (!activeHost) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-lg font-medium">Sin Controlador Seleccionado</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Por favor selecciona o agrega un controlador
            </p>
            <Button onClick={() => navigate('/')}>Ir a Controladores</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Agrupar jobs por estado
  const activeJobs = jobs.filter((j) => j.state === 'active')
  const pausedJobs = jobs.filter((j) => j.state === 'paused')
  const stoppedJobs = jobs.filter((j) => j.state === 'stopped')
  const archivedJobs = jobs.filter((j) => j.state === 'archived')
  const errorJobs = jobs.filter((j) => j.state === 'error')

  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'active':
        return activeJobs
      case 'paused':
        return pausedJobs
      case 'stopped':
        return stoppedJobs
      case 'archived':
        return archivedJobs
      case 'error':
        return errorJobs
      default:
        return jobs
    }
  }

  const filteredJobs = getFilteredJobs()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trabajos</h1>
            <p className="text-muted-foreground">
              Gestiona tus sesiones unificadas de Claude
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4" />
              Nuevo Trabajo
            </Button>
            <Button variant="outline" onClick={loadJobs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <div className="text-2xl text-muted-foreground">#</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-500">{activeJobs.length}</p>
              </div>
              <Activity className="h-6 w-6 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Pausados</p>
                <p className="text-2xl font-bold text-yellow-500">{pausedJobs.length}</p>
              </div>
              <Pause className="h-6 w-6 text-yellow-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Detenidos</p>
                <p className="text-2xl font-bold text-blue-500">{stoppedJobs.length}</p>
              </div>
              <Square className="h-6 w-6 text-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Errores</p>
                <p className="text-2xl font-bold text-red-500">{errorJobs.length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <CreateJobDialog
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreateJob}
        />
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        {[
          { key: 'all', label: 'Todos', count: jobs.length },
          { key: 'active', label: '🟢 Activos', count: activeJobs.length },
          { key: 'paused', label: '⏸️ Pausados', count: pausedJobs.length },
          { key: 'stopped', label: '⏹️ Detenidos', count: stoppedJobs.length },
          { key: 'archived', label: '📦 Archivados', count: archivedJobs.length },
          ...(errorJobs.length > 0
            ? [{ key: 'error', label: '❌ Errores', count: errorJobs.length }]
            : []),
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as JobState | 'all')}
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAction={handleJobAction}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {activeTab === 'all' ? 'Sin Trabajos' : `Sin Trabajos ${activeTab}`}
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {activeTab === 'all'
                ? 'Crea tu primer trabajo para empezar'
                : 'No hay trabajos en este estado'}
            </p>
            {activeTab === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                Nuevo Trabajo
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
