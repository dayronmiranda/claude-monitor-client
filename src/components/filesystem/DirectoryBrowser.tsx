import { useState, useEffect } from 'react'
import { Folder, ChevronRight, AlertCircle, Loader } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Button } from '@/components/ui/Button'
import type { DirectoryEntry } from '@/types'

interface DirectoryBrowserProps {
  initialPath?: string
  onSelect: (path: string) => void
  onCancel: () => void
}

export function DirectoryBrowser({
  initialPath = '/root',
  onSelect,
  onCancel,
}: DirectoryBrowserProps) {
  const { getClient } = useStore()
  const client = getClient()

  const [currentPath, setCurrentPath] = useState(initialPath)
  const [entries, setEntries] = useState<DirectoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDirectory(currentPath)
  }, [])

  const loadDirectory = async (path: string) => {
    if (!client) return

    setLoading(true)
    setError(null)

    try {
      const response = await client.listDirectory(path)
      if (response.success && response.data) {
        setEntries(response.data.entries || [])
        setCurrentPath(response.data.current_path)
      } else {
        setError('Failed to load directory')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (entry: DirectoryEntry) => {
    if (entry.is_dir) {
      loadDirectory(entry.path)
    }
  }

  const handleGoUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    if (parts.length > 1) {
      const parentPath = '/' + parts.slice(0, -1).join('/')
      loadDirectory(parentPath)
    } else {
      loadDirectory('/')
    }
  }

  const handleRetry = () => {
    loadDirectory(currentPath)
  }

  // Build breadcrumbs
  const breadcrumbs = currentPath === '/' ? ['/'] : currentPath.split('/').filter(Boolean)

  const directoryEntries = entries.filter((e) => e.is_dir)

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumbs */}
      <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => loadDirectory('/')}
            className="text-sm hover:text-[hsl(var(--primary))] transition-colors"
          >
            /
          </button>
          {breadcrumbs.length > 1 &&
            breadcrumbs.slice(1).map((part, idx) => {
              const path = '/' + breadcrumbs.slice(1, idx + 2).join('/')
              return (
                <div key={path} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <button
                    onClick={() => loadDirectory(path)}
                    className="text-sm hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    {part}
                  </button>
                </div>
              )
            })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-8 w-8 text-[hsl(var(--destructive))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">{error}</p>
            <Button size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        ) : directoryEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No subdirectories found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {currentPath !== '/' && (
              <button
                onClick={handleGoUp}
                className="w-full flex items-center gap-3 p-3 hover:bg-[hsl(var(--accent))] cursor-pointer rounded-md transition-colors"
              >
                <Folder className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm">..</span>
              </button>
            )}

            {directoryEntries.map((entry) => (
              <button
                key={entry.path}
                onClick={() => handleNavigate(entry)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[hsl(var(--accent))] cursor-pointer rounded-md transition-colors text-left"
              >
                <Folder className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm truncate">{entry.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--border))] px-6 py-4">
        <div className="mb-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Selected:</p>
          <p className="text-sm font-medium truncate break-all">{currentPath}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSelect(currentPath)}>
            Select
          </Button>
        </div>
      </div>
    </div>
  )
}
