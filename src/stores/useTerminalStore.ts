import { create } from 'zustand'
import { useStore } from './useStore'

const MAX_BUFFER_SIZE = 100000

// Check if SharedWorker is supported
const isSharedWorkerSupported = typeof SharedWorker !== 'undefined'

// SharedWorker instance (singleton) - only used if supported
let worker: SharedWorker | null = null
let workerReady = false
const pendingMessages: Array<{ type: string; [key: string]: unknown }> = []

// Fallback: Direct WebSocket connections (for mobile/Safari)
interface DirectConnection {
  ws: WebSocket | null
  buffer: string
  connected: boolean
  terminalId: string
  wsUrl: string
}
const directConnections = new Map<string, DirectConnection>()

// Listeners for terminal events
const outputListeners = new Map<string, Set<(data: string) => void>>()
const statusListeners = new Map<string, Set<(connected: boolean) => void>>()
const reconnectListeners = new Map<string, Set<(attempt: number, delay: number) => void>>()

// Local state cache
const terminalStates = new Map<string, { buffer: string; connected: boolean }>()

// Initialize SharedWorker (only if supported)
function initWorker() {
  if (!isSharedWorkerSupported || worker) return

  try {
    worker = new SharedWorker(
      new URL('../workers/terminalWorker.ts', import.meta.url),
      { type: 'module', name: 'terminal-worker' }
    )

    worker.port.onmessage = (event) => {
      const { type, terminalId, data, buffer, connected, attempt, delay } = event.data

      switch (type) {
        case 'ready':
          workerReady = true
          pendingMessages.forEach(msg => worker?.port.postMessage(msg))
          pendingMessages.length = 0
          break

        case 'init':
        case 'state':
          terminalStates.set(terminalId, { buffer: buffer || '', connected: connected || false })
          statusListeners.get(terminalId)?.forEach(listener => listener(connected))
          break

        case 'output':
          const state = terminalStates.get(terminalId)
          if (state) {
            state.buffer += data
            if (state.buffer.length > MAX_BUFFER_SIZE) {
              state.buffer = state.buffer.slice(-MAX_BUFFER_SIZE)
            }
          }
          outputListeners.get(terminalId)?.forEach(listener => listener(data))
          break

        case 'status':
          const s = terminalStates.get(terminalId)
          if (s) {
            s.connected = connected
          } else {
            terminalStates.set(terminalId, { buffer: '', connected })
          }
          statusListeners.get(terminalId)?.forEach(listener => listener(connected))
          useTerminalStore.setState(state => ({
            connectedTerminals: connected
              ? new Set([...state.connectedTerminals, terminalId])
              : new Set([...state.connectedTerminals].filter(id => id !== terminalId))
          }))
          break

        case 'reconnecting':
          reconnectListeners.get(terminalId)?.forEach(listener => listener(attempt, delay))
          break
      }
    }

    worker.port.onmessageerror = (e) => {
      console.error('SharedWorker message error:', e)
    }

    worker.onerror = (e) => {
      console.error('SharedWorker error:', e)
      worker = null
      workerReady = false
    }

    worker.port.start()
  } catch (e) {
    console.error('Failed to create SharedWorker:', e)
    worker = null
  }
}

// Send message to worker (queue if not ready)
function postMessage(message: { type: string; [key: string]: unknown }) {
  if (!isSharedWorkerSupported) return // Will use direct connection instead

  if (!worker) {
    initWorker()
  }

  if (workerReady && worker) {
    worker.port.postMessage(message)
  } else {
    pendingMessages.push(message)
  }
}

// Fallback: Create direct WebSocket connection
function createDirectConnection(terminalId: string, wsUrl: string) {
  let conn = directConnections.get(terminalId)

  if (conn?.ws && (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING)) {
    return
  }

  const ws = new WebSocket(wsUrl)

  conn = {
    ws,
    buffer: conn?.buffer || '',
    connected: false,
    terminalId,
    wsUrl,
  }
  directConnections.set(terminalId, conn)

  ws.onopen = () => {
    const c = directConnections.get(terminalId)
    if (c) {
      c.connected = true
      terminalStates.set(terminalId, { buffer: c.buffer, connected: true })
      statusListeners.get(terminalId)?.forEach(listener => listener(true))
      useTerminalStore.setState(state => ({
        connectedTerminals: new Set([...state.connectedTerminals, terminalId])
      }))
    }
  }

  ws.onmessage = (event) => {
    const c = directConnections.get(terminalId)
    if (!c) return

    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'output') {
        c.buffer += msg.data
        if (c.buffer.length > MAX_BUFFER_SIZE) {
          c.buffer = c.buffer.slice(-MAX_BUFFER_SIZE)
        }
        const state = terminalStates.get(terminalId)
        if (state) {
          state.buffer = c.buffer
        }
        outputListeners.get(terminalId)?.forEach(listener => listener(msg.data))
      } else if (msg.type === 'closed') {
        outputListeners.get(terminalId)?.forEach(listener => listener('\r\n\x1b[33m[Session closed]\x1b[0m\r\n'))
        c.connected = false
        statusListeners.get(terminalId)?.forEach(listener => listener(false))
      } else if (msg.type === 'error') {
        outputListeners.get(terminalId)?.forEach(listener => listener(`\r\n\x1b[31m[Error: ${msg.message || 'Unknown'}]\x1b[0m\r\n`))
      }
    } catch {
      c.buffer += event.data
      if (c.buffer.length > MAX_BUFFER_SIZE) {
        c.buffer = c.buffer.slice(-MAX_BUFFER_SIZE)
      }
      outputListeners.get(terminalId)?.forEach(listener => listener(event.data))
    }
  }

  ws.onerror = () => {
    const c = directConnections.get(terminalId)
    if (c && !c.connected) {
      outputListeners.get(terminalId)?.forEach(listener => listener('\r\n\x1b[31m[Connection error]\x1b[0m\r\n'))
    }
  }

  ws.onclose = () => {
    const c = directConnections.get(terminalId)
    if (c) {
      c.connected = false
      c.ws = null
      terminalStates.set(terminalId, { buffer: c.buffer, connected: false })
      statusListeners.get(terminalId)?.forEach(listener => listener(false))
      useTerminalStore.setState(state => ({
        connectedTerminals: new Set([...state.connectedTerminals].filter(id => id !== terminalId))
      }))
    }
  }
}

interface TerminalStoreState {
  connectedTerminals: Set<string>

  connect: (terminalId: string) => void
  disconnect: (terminalId: string) => void
  disconnectAll: () => void
  send: (terminalId: string, data: string) => void
  resize: (terminalId: string, cols: number, rows: number) => void

  addOutputListener: (terminalId: string, listener: (data: string) => void) => void
  removeOutputListener: (terminalId: string, listener: (data: string) => void) => void
  addStatusListener: (terminalId: string, listener: (connected: boolean) => void) => void
  removeStatusListener: (terminalId: string, listener: (connected: boolean) => void) => void
  addReconnectListener: (terminalId: string, listener: (attempt: number, delay: number) => void) => void
  removeReconnectListener: (terminalId: string, listener: (attempt: number, delay: number) => void) => void

  getBuffer: (terminalId: string) => string
  isConnected: (terminalId: string) => boolean
}

export const useTerminalStore = create<TerminalStoreState>()((set, get) => {
  // Initialize worker on store creation (if supported)
  if (isSharedWorkerSupported) {
    initWorker()
  }

  return {
    connectedTerminals: new Set(),

    connect: (terminalId: string) => {
      const client = useStore.getState().getClient()
      if (!client) {
        console.error('No API client available')
        return
      }

      const wsUrl = client.getTerminalWSUrl(terminalId)

      if (isSharedWorkerSupported) {
        postMessage({ type: 'connect', terminalId, wsUrl })
      } else {
        // Fallback: Direct WebSocket
        createDirectConnection(terminalId, wsUrl)
      }
    },

    disconnect: (terminalId: string) => {
      if (isSharedWorkerSupported) {
        postMessage({ type: 'disconnect', terminalId })
      } else {
        const conn = directConnections.get(terminalId)
        if (conn?.ws && (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING)) {
          conn.ws.close(1000, 'Disconnecting')
        }
        directConnections.delete(terminalId)
      }
      outputListeners.delete(terminalId)
      statusListeners.delete(terminalId)
      reconnectListeners.delete(terminalId)
      terminalStates.delete(terminalId)
    },

    disconnectAll: () => {
      if (isSharedWorkerSupported) {
        get().connectedTerminals.forEach(terminalId => {
          postMessage({ type: 'disconnect', terminalId })
        })
      } else {
        directConnections.forEach((conn) => {
          if (conn.ws && (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING)) {
            conn.ws.close(1000, 'Disconnecting all')
          }
        })
        directConnections.clear()
      }
      outputListeners.clear()
      statusListeners.clear()
      reconnectListeners.clear()
      terminalStates.clear()
      set({ connectedTerminals: new Set() })
    },

    send: (terminalId: string, data: string) => {
      if (isSharedWorkerSupported) {
        postMessage({ type: 'send', terminalId, data })
      } else {
        const conn = directConnections.get(terminalId)
        if (conn?.ws?.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ type: 'input', data }))
        }
      }
    },

    resize: (terminalId: string, cols: number, rows: number) => {
      if (isSharedWorkerSupported) {
        postMessage({ type: 'resize', terminalId, cols, rows })
      } else {
        const conn = directConnections.get(terminalId)
        if (conn?.ws?.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ type: 'resize', cols, rows }))
        }
      }
    },

    addOutputListener: (terminalId: string, listener: (data: string) => void) => {
      if (!outputListeners.has(terminalId)) {
        outputListeners.set(terminalId, new Set())
      }
      outputListeners.get(terminalId)!.add(listener)
    },

    removeOutputListener: (terminalId: string, listener: (data: string) => void) => {
      outputListeners.get(terminalId)?.delete(listener)
    },

    addStatusListener: (terminalId: string, listener: (connected: boolean) => void) => {
      if (!statusListeners.has(terminalId)) {
        statusListeners.set(terminalId, new Set())
      }
      statusListeners.get(terminalId)!.add(listener)
    },

    removeStatusListener: (terminalId: string, listener: (connected: boolean) => void) => {
      statusListeners.get(terminalId)?.delete(listener)
    },

    addReconnectListener: (terminalId: string, listener: (attempt: number, delay: number) => void) => {
      if (!reconnectListeners.has(terminalId)) {
        reconnectListeners.set(terminalId, new Set())
      }
      reconnectListeners.get(terminalId)!.add(listener)
    },

    removeReconnectListener: (terminalId: string, listener: (attempt: number, delay: number) => void) => {
      reconnectListeners.get(terminalId)?.delete(listener)
    },

    getBuffer: (terminalId: string) => {
      if (isSharedWorkerSupported) {
        return terminalStates.get(terminalId)?.buffer || ''
      } else {
        return directConnections.get(terminalId)?.buffer || ''
      }
    },

    isConnected: (terminalId: string) => {
      if (isSharedWorkerSupported) {
        return terminalStates.get(terminalId)?.connected || false
      } else {
        return directConnections.get(terminalId)?.connected || false
      }
    },
  }
})
