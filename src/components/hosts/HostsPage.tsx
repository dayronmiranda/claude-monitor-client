import { useState } from 'react'
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function HostsPage() {
  const { hosts, activeHostId, addHost, removeHost, setActiveHost, connectHost } =
    useStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: 'admin',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.url && formData.username && formData.password) {
      addHost(formData)
      setFormData({ name: '', url: '', username: 'admin', password: '' })
      setShowForm(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Manage your Claude Monitor drivers
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Add Driver Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <Input
                  placeholder="My Server"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">URL</label>
                <Input
                  placeholder="http://192.168.1.100:9003"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Username</label>
                <Input
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Password</label>
                <Input
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Connect</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Drivers List */}
      {hosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="mb-2 text-lg font-medium">No drivers configured</h3>
            <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
              Add a driver to start managing your Claude instances
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hosts.map((host) => (
            <Card
              key={host.id}
              className={cn(
                'cursor-pointer transition-all',
                host.id === activeHostId && 'ring-2 ring-[hsl(var(--primary))]'
              )}
              onClick={() => setActiveHost(host.id)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {host.status === 'online' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {host.status === 'offline' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  {host.status === 'connecting' && (
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                  )}
                  <CardTitle className="text-base">{host.name}</CardTitle>
                </div>
                {host.id === activeHostId && (
                  <Badge variant="success">Active</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-sm text-[hsl(var(--muted-foreground))]">
                  {host.url}
                </div>

                {host.info && (
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-[hsl(var(--secondary))] p-2">
                      <div className="text-lg font-bold">
                        {host.info.stats.total_projects}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        Projects
                      </div>
                    </div>
                    <div className="rounded bg-[hsl(var(--secondary))] p-2">
                      <div className="text-lg font-bold">
                        {host.info.stats.total_sessions}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        Sessions
                      </div>
                    </div>
                    <div className="rounded bg-[hsl(var(--secondary))] p-2">
                      <div className="text-lg font-bold">
                        {host.info.stats.active_terminals}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        Active
                      </div>
                    </div>
                  </div>
                )}

                {host.info && (
                  <div className="mb-3 text-xs text-[hsl(var(--muted-foreground))]">
                    {host.info.platform}/{host.info.arch} · v{host.info.version} ·
                    Uptime: {host.info.uptime}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      connectHost(host.id)
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[hsl(var(--destructive))]"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Remove this driver?')) {
                        removeHost(host.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
