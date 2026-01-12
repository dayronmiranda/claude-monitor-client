import { NavLink } from 'react-router-dom'
import {
  Server,
  FolderOpen,
  Terminal,
  Briefcase,
  BarChart3,
  Settings,
  MonitorSmartphone,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const navItems = [
  { to: '/', icon: Server, label: 'Drivers' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/terminals', icon: Terminal, label: 'Terminals' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { hosts, activeHostId } = useStore()
  const activeHost = hosts.find((h) => h.id === activeHostId)
  const onlineCount = hosts.filter((h) => h.status === 'online').length

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-6 w-6 text-[hsl(var(--primary))]" />
          <span className="font-semibold">Claude Monitor</span>
        </div>
        {/* Close button - mobile only */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Active Host Indicator */}
      {activeHost && (
        <div className="border-b border-[hsl(var(--border))] p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Active Driver</div>
          <div className="mt-1 flex items-center gap-2">
            <div
              className={cn('h-2 w-2 rounded-full', {
                'bg-green-500': activeHost.status === 'online',
                'bg-yellow-500 animate-pulse': activeHost.status === 'connecting',
                'bg-red-500': activeHost.status === 'offline',
              })}
            />
            <span className="truncate text-sm font-medium">{activeHost.name}</span>
          </div>
          {activeHost.info && (
            <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {activeHost.info.stats.total_projects} projects · {activeHost.info.stats.active_terminals} active
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.to === '/' && onlineCount > 0 && (
              <Badge variant="success" className="ml-auto">
                {onlineCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      <div className="border-t border-[hsl(var(--border))] p-4 text-xs text-[hsl(var(--muted-foreground))]">
        Client v1.0.0
      </div>
    </aside>
  )
}
