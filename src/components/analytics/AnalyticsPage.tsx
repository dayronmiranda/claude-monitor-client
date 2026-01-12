import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  RefreshCw,
  FolderOpen,
  MessageSquare,
  HardDrive,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatBytes, formatDate, cn } from '@/lib/utils'
import type { GlobalAnalytics, DailyActivity } from '@/types'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const { getClient, getActiveHost } = useStore()
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null)
  const [loading, setLoading] = useState(false)

  const client = getClient()
  const activeHost = getActiveHost()

  const loadAnalytics = async (refresh = false) => {
    if (!client) return
    setLoading(true)
    try {
      const response = await client.getGlobalAnalytics(refresh)
      if (response.success && response.data) {
        setAnalytics(response.data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [client])

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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Usage statistics for {activeHost.name}
          </p>
        </div>
        <Button onClick={() => loadAnalytics(true)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {analytics && (
        <>
          {/* Stats Grid */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-[hsl(var(--primary))]/20 p-3">
                    <FolderOpen className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analytics.total_projects}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{analytics.total_sessions}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <MessageSquare className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{analytics.total_messages.toLocaleString()}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Total Messages</div>
                    <div className="mt-2 flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium text-blue-400">
                          {analytics.total_user_messages.toLocaleString()} user
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {analytics.total_assistant_messages.toLocaleString()} assistant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-yellow-500/20 p-3">
                    <HardDrive className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatBytes(analytics.total_size_bytes)}</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Total Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Calendar */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activity Calendar ({analytics.active_days} active days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityCalendar activity={analytics.daily_activity} />
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle>Projects by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.projects_summary
                  .sort((a, b) => b.messages - a.messages)
                  .map((project) => (
                    <div
                      key={project.path}
                      className="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))] p-3 cursor-pointer hover:bg-[hsl(var(--secondary))]/80"
                      onClick={() => navigate(`/projects/${encodeURIComponent(project.path)}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
                        <div>
                          <div className="font-medium">{project.real_path}</div>
                          <div className="text-sm text-[hsl(var(--muted-foreground))]">
                            {project.sessions} sessions · {formatBytes(project.size_bytes)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{project.messages.toLocaleString()}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">messages</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Cache Info */}
          <div className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Last updated: {formatDate(analytics.last_updated)} ·
            Cached until: {formatDate(analytics.cached_until)}
          </div>
        </>
      )}

      {!analytics && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-lg font-medium">No data available</h3>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Activity Calendar Component
function ActivityCalendar({ activity }: { activity: DailyActivity[] }) {
  const activityMap = new Map(activity.map((a) => [a.date, a.messages]))

  // Get last 90 days
  const days: { date: string; messages: number }[] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      messages: activityMap.get(dateStr) || 0,
    })
  }

  const maxMessages = Math.max(...days.map((d) => d.messages), 1)

  const getColor = (messages: number) => {
    if (messages === 0) return 'bg-[hsl(var(--secondary))]'
    const intensity = messages / maxMessages
    if (intensity > 0.75) return 'bg-green-500'
    if (intensity > 0.5) return 'bg-green-600'
    if (intensity > 0.25) return 'bg-green-700'
    return 'bg-green-800'
  }

  // Group by weeks
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn(
                  'h-3 w-3 rounded-sm transition-colors',
                  getColor(day.messages)
                )}
                title={`${day.date}: ${day.messages} messages`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-[hsl(var(--secondary))]" />
          <div className="h-3 w-3 rounded-sm bg-green-800" />
          <div className="h-3 w-3 rounded-sm bg-green-700" />
          <div className="h-3 w-3 rounded-sm bg-green-600" />
          <div className="h-3 w-3 rounded-sm bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
