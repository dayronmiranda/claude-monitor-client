import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Host, HostInfo } from '@/types'
import { APIClient } from '@/services/api'

// UUID generator that works in HTTP contexts
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface AppState {
  // Hosts/Drivers
  hosts: Host[]
  activeHostId: string | null

  // API clients cache
  clients: Map<string, APIClient>

  // Actions
  addHost: (host: Omit<Host, 'id' | 'status'>) => void
  removeHost: (id: string) => void
  updateHost: (id: string, updates: Partial<Host>) => void
  setActiveHost: (id: string | null) => void
  connectHost: (id: string) => Promise<void>
  disconnectHost: (id: string) => void

  // Getters
  getActiveHost: () => Host | null
  getClient: (hostId?: string) => APIClient | null
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hosts: [],
      activeHostId: null,
      clients: new Map(),

      addHost: (hostData) => {
        const id = generateUUID()
        const host: Host = {
          ...hostData,
          id,
          status: 'offline',
        }
        set((state) => ({
          hosts: [...state.hosts, host],
        }))
        // Auto-connect
        get().connectHost(id)
      },

      removeHost: (id) => {
        get().disconnectHost(id)
        set((state) => ({
          hosts: state.hosts.filter((h) => h.id !== id),
          activeHostId: state.activeHostId === id ? null : state.activeHostId,
        }))
      },

      updateHost: (id, updates) => {
        set((state) => ({
          hosts: state.hosts.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }))
      },

      setActiveHost: (id) => {
        set({ activeHostId: id })
      },

      connectHost: async (id) => {
        const host = get().hosts.find((h) => h.id === id)
        if (!host) return

        set((state) => ({
          hosts: state.hosts.map((h) =>
            h.id === id ? { ...h, status: 'connecting' as const } : h
          ),
        }))

        try {
          const client = new APIClient(host.url, host.username, host.password)
          const response = await client.getHost()

          if (response.success && response.data) {
            const clients = new Map(get().clients)
            clients.set(id, client)

            set((state) => ({
              clients,
              hosts: state.hosts.map((h) =>
                h.id === id
                  ? { ...h, status: 'online' as const, info: response.data as HostInfo }
                  : h
              ),
            }))

            // Auto-select if no active host
            if (!get().activeHostId) {
              set({ activeHostId: id })
            }
          } else {
            throw new Error(response.error || 'Connection failed')
          }
        } catch (error) {
          console.error('Failed to connect to host:', error)
          set((state) => ({
            hosts: state.hosts.map((h) =>
              h.id === id ? { ...h, status: 'offline' as const } : h
            ),
          }))
        }
      },

      disconnectHost: (id) => {
        const clients = new Map(get().clients)
        clients.delete(id)
        set((state) => ({
          clients,
          hosts: state.hosts.map((h) =>
            h.id === id ? { ...h, status: 'offline' as const, info: undefined } : h
          ),
        }))
      },

      getActiveHost: () => {
        const { hosts, activeHostId } = get()
        return hosts.find((h) => h.id === activeHostId) || null
      },

      getClient: (hostId) => {
        const id = hostId || get().activeHostId
        if (!id) return null
        return get().clients.get(id) || null
      },
    }),
    {
      name: 'claude-monitor-storage',
      partialize: (state) => ({
        hosts: state.hosts.map((h) => ({
          ...h,
          status: 'offline' as const,
          info: undefined,
        })),
        activeHostId: state.activeHostId,
      }),
    }
  )
)

// Initialize connections on app load
export const initializeConnections = () => {
  const { hosts, connectHost } = useStore.getState()
  hosts.forEach((host) => {
    connectHost(host.id)
  })
}
