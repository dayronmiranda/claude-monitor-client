import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  RefreshCw,
  Trash2,
  ArrowLeft,
  Play,
  Import,
  Eraser,
  CheckSquare,
  Square,
  Pencil,
  X,
  Check,
  User,
  Bot,
  Loader2,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import type { Session, Project, SessionMessage } from '@/types'

export function SessionsPage() {
  const { projectPath } = useParams<{ projectPath: string }>()
  const navigate = useNavigate()
  const { getClient } = useStore()

  const [project, setProject] = useState<Project | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const client = getClient()
  const decodedPath = projectPath ? decodeURIComponent(projectPath) : ''

  const loadData = async () => {
    if (!client || !decodedPath) return
    setLoading(true)
    setError(null)
    try {
      const [projectRes, sessionsRes] = await Promise.all([
        client.getProject(decodedPath),
        client.listSessions(decodedPath),
      ])
      if (projectRes.success && projectRes.data) {
        setProject(projectRes.data)
      }
      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [client, decodedPath])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const selectAll = () => {
    if (selected.size === sessions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sessions.map((s) => s.id)))
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!client || !decodedPath) return
    if (!confirm('Delete this session?')) return
    try {
      await client.deleteSession(decodedPath, sessionId)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleDeleteSelected = async () => {
    if (!client || !decodedPath || selected.size === 0) return
    if (!confirm(`Delete ${selected.size} sessions?`)) return
    try {
      await client.deleteMultipleSessions(decodedPath, Array.from(selected))
      setSelected(new Set())
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleCleanEmpty = async () => {
    if (!client || !decodedPath) return
    if (!confirm('Delete all empty sessions (0 messages)?')) return
    try {
      const result = await client.cleanEmptySessions(decodedPath)
      alert(`Deleted ${result.data?.deleted || 0} empty sessions`)
      loadData()
    } catch (err) {
      console.error('Failed to clean:', err)
    }
  }

  const handleImport = async (sessionId: string) => {
    if (!client || !decodedPath) return
    try {
      await client.importSession(decodedPath, sessionId)
      alert('Session imported successfully')
    } catch (err) {
      console.error('Failed to import:', err)
    }
  }

  const handleResume = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    const workDir = session?.real_path || project?.real_path || decodedPath
    navigate(`/terminals?workdir=${encodeURIComponent(workDir)}&session=${sessionId}&resume=true`)
  }

  const startEditing = (session: Session) => {
    setEditingId(session.id)
    setEditName(session.name || session.first_message || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleRename = async (sessionId: string) => {
    if (!client || !decodedPath) return
    try {
      const result = await client.renameSession(decodedPath, sessionId, editName.trim())
      if (result.success) {
        setSessions(sessions.map(s =>
          s.id === sessionId ? { ...s, name: editName.trim() } : s
        ))
      }
      setEditingId(null)
      setEditName('')
    } catch (err) {
      console.error('Failed to rename:', err)
    }
  }

  const getSessionDisplayName = (session: Session) => {
    if (session.name) return session.name
    if (session.first_message) return session.first_message
    return session.id.slice(0, 8)
  }

  const loadMessages = async (session: Session) => {
    if (!client || !decodedPath) return
    setSelectedSession(session)
    setMessagesLoading(true)
    try {
      const res = await client.getSessionMessages(decodedPath, session.id)
      if (res.success && res.data) {
        setMessages(res.data)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  const closeMessages = () => {
    setSelectedSession(null)
    setMessages([])
  }

  const emptyCount = sessions.filter((s) => s.message_count === 0).length

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Back to Projects</span>
        </Button>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{project?.real_path || 'Sessions'}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {sessions.length} sessions · {emptyCount} empty
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {emptyCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleCleanEmpty}>
              <Eraser className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Clean ({emptyCount})</span>
            </Button>
          )}
          <Button onClick={loadData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Selection Bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-[hsl(var(--secondary))] p-3">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Cancel
          </Button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">
            <button onClick={selectAll} className="hover:text-[hsl(var(--foreground))]">
              {selected.size === sessions.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span>Select All</span>
          </div>
        )}

        {sessions.map((session) => (
          <Card
            key={session.id}
            className={`transition-all hover:bg-[hsl(var(--secondary))] cursor-pointer ${
              selectedSession?.id === session.id ? 'ring-2 ring-[hsl(var(--primary))]' : ''
            }`}
            onClick={() => loadMessages(session)}
          >
            <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(session.id) }}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex-shrink-0"
              >
                {selected.has(session.id) ? (
                  <CheckSquare className="h-5 w-5 text-[hsl(var(--primary))]" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>

              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-[hsl(var(--primary))] flex-shrink-0" />

              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(session.id)
                        if (e.key === 'Escape') cancelEditing()
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleRename(session.id) }}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); cancelEditing() }}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium truncate flex items-center gap-2 text-sm sm:text-base">
                      {session.name && (
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                          Named
                        </Badge>
                      )}
                      {getSessionDisplayName(session)}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                      <span>{session.message_count} msg</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{formatBytes(session.size_bytes)}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(session.modified_at)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {session.message_count === 0 && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">Empty</Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  title="Rename session"
                  onClick={(e) => { e.stopPropagation(); startEditing(session) }}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Resume in terminal"
                  onClick={(e) => { e.stopPropagation(); handleResume(session.id) }}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Import session"
                  onClick={(e) => { e.stopPropagation(); handleImport(session.id) }}
                  className="h-8 w-8 p-0 hidden sm:inline-flex"
                >
                  <Import className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[hsl(var(--destructive))] h-8 w-8 p-0"
                  title="Delete session"
                  onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-lg font-medium">No sessions</h3>
          </CardContent>
        </Card>
      )}

      {/* Messages Panel */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--background))] rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--secondary))]">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold truncate">
                  {getSessionDisplayName(selectedSession)}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {messages.length} messages
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeMessages}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p>No messages in this session</p>
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
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-[hsl(var(--primary))] text-white'
                          : 'bg-[hsl(var(--secondary))]'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans text-sm break-words">
                        {msg.content}
                      </pre>
                      {msg.timestamp && (
                        <p className={`text-xs mt-2 ${
                          msg.type === 'user' ? 'text-white/70' : 'text-[hsl(var(--muted-foreground))]'
                        }`}>
                          {formatRelativeTime(msg.timestamp)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
