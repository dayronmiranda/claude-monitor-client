import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  RefreshCw,
  Trash2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import type { Project } from '@/types'

export function ProjectsPage() {
  const navigate = useNavigate()
  const { getClient, getActiveHost } = useStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = getClient()
  const activeHost = getActiveHost()

  const loadProjects = async () => {
    if (!client) return
    setLoading(true)
    setError(null)
    try {
      const response = await client.listProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      } else {
        setError(response.error || 'Failed to load projects')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [client])

  const handleDelete = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!client) return
    if (!confirm('Delete this project and all its sessions?')) return

    try {
      await client.deleteProject(path)
      loadProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  if (!activeHost) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-lg font-medium">No Driver Selected</h3>
            <p className="mb-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Please select or add a driver first
            </p>
            <Button onClick={() => navigate('/')}>Go to Drivers</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Claude projects on {activeHost.name}
          </p>
        </div>
        <Button onClick={loadProjects} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {projects.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="mb-2 text-lg font-medium">No projects found</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Start using Claude Code to create projects
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-all hover:bg-[hsl(var(--secondary))]"
              onClick={() => navigate(`/projects/${encodeURIComponent(project.path)}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <FolderOpen className="h-10 w-10 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-medium">{project.real_path}</div>
                    <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                      <span>{project.session_count} sessions</span>
                      <span>·</span>
                      <span>{formatRelativeTime(project.last_modified)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {project.session_count}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[hsl(var(--destructive))]"
                    onClick={(e) => handleDelete(project.path, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
