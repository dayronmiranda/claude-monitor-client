// SharedWorker for persistent WebSocket connections
// This worker maintains WebSocket connections across page navigations and tabs

const MAX_BUFFER_SIZE = 100000 // 100KB per terminal
const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

interface TerminalConnection {
  ws: WebSocket | null
  buffer: string
  connected: boolean
  terminalId: string
  wsUrl: string
  reconnectAttempts: number
  reconnectTimeout: ReturnType<typeof setTimeout> | null
}

interface PortInfo {
  port: MessagePort
  subscribedTerminals: Set<string>
}

// Store all connections
const connections = new Map<string, TerminalConnection>()

// Store all connected ports (tabs/pages)
const ports: PortInfo[] = []

// Broadcast message to all ports subscribed to a terminal
function broadcastToTerminal(terminalId: string, message: object) {
  ports.forEach(portInfo => {
    if (portInfo.subscribedTerminals.has(terminalId)) {
      portInfo.port.postMessage({ ...message, terminalId })
    }
  })
}


// Create WebSocket connection
function createConnection(terminalId: string, wsUrl: string) {
  let conn = connections.get(terminalId)

  // If already connected or connecting, just return
  if (conn?.ws && (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING)) {
    return
  }

  // Create or update connection entry
  if (!conn) {
    conn = {
      ws: null,
      buffer: '',
      connected: false,
      terminalId,
      wsUrl,
      reconnectAttempts: 0,
      reconnectTimeout: null,
    }
    connections.set(terminalId, conn)
  }

  // Clear any pending reconnect
  if (conn.reconnectTimeout) {
    clearTimeout(conn.reconnectTimeout)
    conn.reconnectTimeout = null
  }

  // Create WebSocket
  const ws = new WebSocket(wsUrl)
  conn.ws = ws
  conn.wsUrl = wsUrl

  ws.onopen = () => {
    const c = connections.get(terminalId)
    if (c) {
      c.connected = true
      c.reconnectAttempts = 0
      broadcastToTerminal(terminalId, { type: 'status', connected: true })
    }
  }

  ws.onmessage = (event) => {
    const c = connections.get(terminalId)
    if (!c) return

    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'output') {
        // Append to buffer
        c.buffer += msg.data
        if (c.buffer.length > MAX_BUFFER_SIZE) {
          c.buffer = c.buffer.slice(-MAX_BUFFER_SIZE)
        }
        broadcastToTerminal(terminalId, { type: 'output', data: msg.data })
      } else if (msg.type === 'closed') {
        broadcastToTerminal(terminalId, { type: 'output', data: '\r\n\x1b[33m[Session closed]\x1b[0m\r\n' })
        c.connected = false
        broadcastToTerminal(terminalId, { type: 'status', connected: false })
      } else if (msg.type === 'error') {
        broadcastToTerminal(terminalId, { type: 'output', data: `\r\n\x1b[31m[Error: ${msg.message || 'Unknown'}]\x1b[0m\r\n` })
      }
    } catch {
      // Raw data
      c.buffer += event.data
      if (c.buffer.length > MAX_BUFFER_SIZE) {
        c.buffer = c.buffer.slice(-MAX_BUFFER_SIZE)
      }
      broadcastToTerminal(terminalId, { type: 'output', data: event.data })
    }
  }

  ws.onerror = () => {
    const c = connections.get(terminalId)
    if (c && !c.connected) {
      broadcastToTerminal(terminalId, { type: 'output', data: '\r\n\x1b[31m[Connection error]\x1b[0m\r\n' })
    }
  }

  ws.onclose = () => {
    const c = connections.get(terminalId)
    if (c) {
      c.connected = false
      c.ws = null
      broadcastToTerminal(terminalId, { type: 'status', connected: false })

      // Auto-reconnect with exponential backoff
      scheduleReconnect(terminalId)
    }
  }
}

// Schedule reconnection with exponential backoff
function scheduleReconnect(terminalId: string) {
  const conn = connections.get(terminalId)
  if (!conn || conn.reconnectTimeout) return

  // Check if any port is still subscribed
  const hasSubscribers = ports.some(p => p.subscribedTerminals.has(terminalId))
  if (!hasSubscribers) {
    // No subscribers, don't reconnect
    connections.delete(terminalId)
    return
  }

  const delay = Math.min(
    RECONNECT_BASE_DELAY * Math.pow(2, conn.reconnectAttempts),
    RECONNECT_MAX_DELAY
  )

  conn.reconnectAttempts++

  broadcastToTerminal(terminalId, {
    type: 'reconnecting',
    attempt: conn.reconnectAttempts,
    delay
  })

  conn.reconnectTimeout = setTimeout(() => {
    conn.reconnectTimeout = null
    createConnection(terminalId, conn.wsUrl)
  }, delay)
}

// Disconnect terminal
function disconnectTerminal(terminalId: string) {
  const conn = connections.get(terminalId)
  if (conn) {
    if (conn.reconnectTimeout) {
      clearTimeout(conn.reconnectTimeout)
    }
    if (conn.ws && (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING)) {
      conn.ws.close(1000, 'Disconnecting')
    }
    connections.delete(terminalId)
  }
}

// Send data to terminal
function sendToTerminal(terminalId: string, data: string) {
  const conn = connections.get(terminalId)
  if (conn?.ws?.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify({ type: 'input', data }))
  }
}

// Resize terminal
function resizeTerminal(terminalId: string, cols: number, rows: number) {
  const conn = connections.get(terminalId)
  if (conn?.ws?.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify({ type: 'resize', cols, rows }))
  }
}

// Get buffer for terminal
function getBuffer(terminalId: string): string {
  return connections.get(terminalId)?.buffer || ''
}

// Check if connected
function isConnected(terminalId: string): boolean {
  return connections.get(terminalId)?.connected || false
}

// Handle port messages
function handlePortMessage(portInfo: PortInfo, event: MessageEvent) {
  const { type, terminalId, wsUrl, data, cols, rows } = event.data

  switch (type) {
    case 'connect':
      portInfo.subscribedTerminals.add(terminalId)
      createConnection(terminalId, wsUrl)
      // Send current state
      portInfo.port.postMessage({
        type: 'init',
        terminalId,
        buffer: getBuffer(terminalId),
        connected: isConnected(terminalId),
      })
      break

    case 'disconnect':
      portInfo.subscribedTerminals.delete(terminalId)
      // Check if any other port is subscribed
      const hasOtherSubscribers = ports.some(
        p => p !== portInfo && p.subscribedTerminals.has(terminalId)
      )
      if (!hasOtherSubscribers) {
        disconnectTerminal(terminalId)
      }
      break

    case 'send':
      sendToTerminal(terminalId, data)
      break

    case 'resize':
      resizeTerminal(terminalId, cols, rows)
      break

    case 'getState':
      portInfo.port.postMessage({
        type: 'state',
        terminalId,
        buffer: getBuffer(terminalId),
        connected: isConnected(terminalId),
      })
      break

    case 'subscribe':
      portInfo.subscribedTerminals.add(terminalId)
      break

    case 'unsubscribe':
      portInfo.subscribedTerminals.delete(terminalId)
      break
  }
}

// SharedWorker connection handler
self.onconnect = (e: MessageEvent) => {
  const port = e.ports[0]

  const portInfo: PortInfo = {
    port,
    subscribedTerminals: new Set(),
  }

  ports.push(portInfo)

  port.onmessage = (event) => handlePortMessage(portInfo, event)

  port.onmessageerror = () => {
    // Remove port on error
    const index = ports.indexOf(portInfo)
    if (index > -1) {
      ports.splice(index, 1)
    }
  }

  // Send ready message
  port.postMessage({ type: 'ready' })
}

// For TypeScript - declare SharedWorker types
interface SharedWorkerGlobalScope {
  onconnect: ((this: SharedWorkerGlobalScope, ev: MessageEvent) => void) | null
}

declare const self: SharedWorkerGlobalScope & typeof globalThis
export {}
