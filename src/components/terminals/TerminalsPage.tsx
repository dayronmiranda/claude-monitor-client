import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Terminal as TerminalIcon,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import type { Terminal } from '@/types'

export function TerminalsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getClient, getActiveHost } = useStore()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    work_dir: searchParams.get('workdir') ? decodeURIComponent(searchParams.get('workdir')!) : '/root',
    type: 'claude' as 'claude' | 'terminal',
    session_id: searchParams.get('session') || '',
    resume: searchParams.get('resume') === 'true',
  })

  const client = getClient()
  const activeHost = getActiveHost()

  const loadTerminals = async () => {
    if (!client) return
    setLoading(true)
    try {
      const response = await client.listTerminals()
      if (response.success && response.data) {
        setTerminals(response.data)
      }
    } catch (err) {
      console.error('Failed to load terminals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTerminals()
    // Auto-open form if coming from session resume
    if (searchParams.get('session')) {
      setShowForm(true)
    }
  }, [client])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !formData.work_dir) return

    try {
      const config = {
        name: formData.name || undefined,
        work_dir: formData.work_dir,
        type: formData.type,
        id: formData.session_id || undefined,
        resume: formData.resume,
      }
      const response = await client.createTerminal(config)
      if (response.success && response.data) {
        navigate(`/terminals/${response.data.id}`)
      }
    } catch (err) {
      console.error('Failed to create terminal:', err)
    }
  }

  const handleKill = async (id: string) => {
    if (!client) return
    try {
      await client.killTerminal(id)
      loadTerminals()
    } catch (err) {
      console.error('Failed to kill terminal:', err)
    }
  }

  const handleResume = async (id: string) => {
    if (!client) return
    try {
      const response = await client.resumeTerminal(id)
      if (response.success && response.data) {
        navigate(`/terminals/${response.data.id}`)
      }
    } catch (err) {
      console.error('Failed to resume terminal:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!client) return
    if (!confirm('Delete this terminal record?')) return
    try {
      await client.deleteTerminal(id)
      loadTerminals()
    } catch (err) {
      console.error('Failed to delete terminal:', err)
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

  const activeTerminals = terminals.filter((t) => t.active)
  const stoppedTerminals = terminals.filter((t) => !t.active)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Terminals</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {activeTerminals.length} active · {stoppedTerminals.length} stopped
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            New Terminal
          </Button>
          <Button variant="outline" onClick={loadTerminals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* New Terminal Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Terminal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Name (optional)</label>
                <Input
                  placeholder="My Terminal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Working Directory</label>
                <Input
                  placeholder="/root/project"
                  value={formData.work_dir}
                  onChange={(e) => setFormData({ ...formData, work_dir: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'claude' | 'terminal' })}
                >
                  <option value="claude">Claude</option>
                  <option value="terminal">Bash Terminal</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Session ID (for resume)</label>
                <Input
                  placeholder="UUID or leave empty"
                  value={formData.session_id}
                  onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                />
              </div>
              {formData.session_id && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.resume}
                      onChange={(e) => setFormData({ ...formData, resume: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Resume session (use --resume flag)</span>
                  </label>
                </div>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Create Terminal</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Terminals */}
      {activeTerminals.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Active</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTerminals.map((terminal) => (
              <Card
                key={terminal.id}
                className="cursor-pointer transition-all hover:ring-2 hover:ring-[hsl(var(--primary))]"
                onClick={() => navigate(`/terminals/${terminal.id}`)}
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-medium">{terminal.name}</span>
                    </div>
                    <Badge variant="success">Running</Badge>
                  </div>
                  <div className="mb-3 text-sm text-[hsl(var(--muted-foreground))]">
                    {terminal.work_dir}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{terminal.type}</span>
                    <span>{terminal.clients} clients</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleKill(terminal.id)
                      }}
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stopped Terminals */}
      {stoppedTerminals.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Stopped</h2>
          <div className="space-y-2">
            {stoppedTerminals.map((terminal) => (
              <Card key={terminal.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <TerminalIcon className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                    <div>
                      <div className="font-medium">{terminal.name}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">
                        {terminal.work_dir} · {formatRelativeTime(terminal.last_access_at || '')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {terminal.can_resume && (
                      <Button size="sm" onClick={() => handleResume(terminal.id)}>
                        <Play className="h-4 w-4" />
                        Resume
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[hsl(var(--destructive))]"
                      onClick={() => handleDelete(terminal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {terminals.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TerminalIcon className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="mb-2 text-lg font-medium">No terminals</h3>
            <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
              Create a new terminal to start
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Terminal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
