import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Maximize2, Minimize2, Send, CornerDownLeft, Keyboard, Loader2 } from 'lucide-react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useStore } from '@/stores/useStore'
import { useTerminalStore } from '@/stores/useTerminalStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { Terminal as TerminalType } from '@/types'

export function TerminalView() {
  const { terminalId } = useParams<{ terminalId: string }>()
  const navigate = useNavigate()
  const { getClient, hosts, activeHostId } = useStore()
  const client = getClient()
  const activeHost = hosts.find(h => h.id === activeHostId)

  // Terminal store for persistent WebSocket connections
  const {
    connect,
    send,
    resize,
    addOutputListener,
    removeOutputListener,
    addStatusListener,
    removeStatusListener,
    getBuffer,
    isConnected,
  } = useTerminalStore()

  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const externalInputRef = useRef<HTMLInputElement>(null)

  const [terminal, setTerminal] = useState<TerminalType | null>(null)
  const [connected, setConnected] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [externalCommand, setExternalCommand] = useState('')
  const [showExternalInput, setShowExternalInput] = useState(false)

  // Send data to terminal via store
  const sendToTerminal = useCallback((data: string) => {
    if (terminalId) {
      send(terminalId, data)
    }
  }, [terminalId, send])

  // Send external command
  const handleSendCommand = () => {
    if (externalCommand.trim()) {
      sendToTerminal(externalCommand)
      setExternalCommand('')
      externalInputRef.current?.focus()
    }
  }

  // Send command with Enter
  const handleSendCommandWithEnter = () => {
    if (externalCommand.trim()) {
      sendToTerminal(externalCommand + '\r')
      setExternalCommand('')
      externalInputRef.current?.focus()
    }
  }

  // Send special keys
  const sendEnter = () => sendToTerminal('\r')
  const sendCtrlC = () => sendToTerminal('\x03')
  const sendCtrlD = () => sendToTerminal('\x04')
  const sendCtrlZ = () => sendToTerminal('\x1a')
  const sendCtrlL = () => sendToTerminal('\x0c')
  const sendTab = () => sendToTerminal('\t')
  const sendEscape = () => sendToTerminal('\x1b')
  const sendArrowUp = () => sendToTerminal('\x1b[A')
  const sendArrowDown = () => sendToTerminal('\x1b[B')

  // Load terminal info
  useEffect(() => {
    if (!client || !terminalId) return
    client.getTerminal(terminalId).then((res) => {
      if (res.success && res.data) {
        setTerminal(res.data)
      }
    })
  }, [client, terminalId])

  // Initialize xterm and connect to persistent WebSocket
  useEffect(() => {
    // Wait for client to be available (after host reconnection)
    if (!terminalRef.current || !terminalId || !client) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      theme: {
        background: '#111111',
        foreground: '#f0f0f0',
        cursor: '#22c55e',
        cursorAccent: '#111111',
        selectionBackground: '#3b3b3b',
        black: '#1a1a1a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f0f0f0',
        brightBlack: '#4b5563',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Write existing buffer (from previous connection)
    const existingBuffer = getBuffer(terminalId)
    if (existingBuffer) {
      term.write(existingBuffer)
    }

    // Set initial connection status
    setConnected(isConnected(terminalId))

    // Output listener - writes new data to xterm
    const outputListener = (data: string) => {
      term.write(data)
    }

    // Status listener - updates connected state
    const statusListener = (status: boolean) => {
      setConnected(status)
      if (status) {
        // Send resize when connected
        const { cols, rows } = term
        resize(terminalId, cols, rows)
      }
    }

    // Add listeners
    addOutputListener(terminalId, outputListener)
    addStatusListener(terminalId, statusListener)

    // Connect if not already connected
    connect(terminalId)

    // Handle keyboard input from xterm
    term.onData((data) => {
      send(terminalId, data)
    })

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit()
      const { cols, rows } = term
      resize(terminalId, cols, rows)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup: only remove listeners, don't close connection
    return () => {
      window.removeEventListener('resize', handleResize)
      removeOutputListener(terminalId, outputListener)
      removeStatusListener(terminalId, statusListener)
      term.dispose()
    }
  }, [client, terminalId, connect, send, resize, addOutputListener, removeOutputListener, addStatusListener, removeStatusListener, getBuffer, isConnected])

  // Handle fullscreen resize
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100)
    }
  }, [fullscreen, showExternalInput])

  // Show loading state while host is reconnecting
  if (!client || activeHost?.status === 'connecting') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        <p className="text-[hsl(var(--muted-foreground))]">
          {activeHost?.status === 'connecting' ? 'Reconnecting to host...' : 'Waiting for host connection...'}
        </p>
        <Button variant="outline" onClick={() => navigate('/terminals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Terminals
        </Button>
      </div>
    )
  }

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-[hsl(var(--background))]' : 'h-full flex flex-col'}>
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {!fullscreen && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/terminals')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="font-medium truncate">{terminal?.name || terminalId?.slice(0, 8)}</span>
          </div>
          {terminal && (
            <Badge variant="secondary" className="hidden sm:inline-flex">{terminal.type}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className="text-sm text-[hsl(var(--muted-foreground))] hidden md:block truncate max-w-[200px]">
            {terminal?.work_dir}
          </span>
          <Button
            variant={showExternalInput ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setShowExternalInput(!showExternalInput)}
            title="External Input"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* External Input Panel */}
      {showExternalInput && (
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 sm:p-3 space-y-2 sm:space-y-3">
          {/* Command Input */}
          <div className="flex gap-1 sm:gap-2">
            <Input
              ref={externalInputRef}
              placeholder="Type command..."
              value={externalCommand}
              onChange={(e) => setExternalCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    handleSendCommand() // Send without Enter
                  } else {
                    handleSendCommandWithEnter() // Send with Enter
                  }
                }
              }}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleSendCommand} variant="outline" title="Send text only" size="sm" className="px-2 sm:px-3">
              <Send className="h-4 w-4" />
            </Button>
            <Button onClick={handleSendCommandWithEnter} title="Send + Enter" size="sm" className="px-2 sm:px-3">
              <CornerDownLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Run</span>
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))] self-center mr-1 hidden sm:inline">
              Quick:
            </span>
            <Button size="sm" variant="outline" onClick={sendEnter} className="text-xs px-2">
              Enter
            </Button>
            <Button size="sm" variant="outline" onClick={sendTab} className="text-xs px-2">
              Tab
            </Button>
            <Button size="sm" variant="outline" onClick={sendArrowUp} className="text-xs px-2">
              ↑
            </Button>
            <Button size="sm" variant="outline" onClick={sendArrowDown} className="text-xs px-2">
              ↓
            </Button>
            <Button size="sm" variant="outline" onClick={sendEscape} className="text-xs px-2">
              Esc
            </Button>
            <Button size="sm" variant="destructive" onClick={sendCtrlC} title="Interrupt" className="text-xs px-2">
              ^C
            </Button>
            <Button size="sm" variant="outline" onClick={sendCtrlD} title="EOF" className="text-xs px-2">
              ^D
            </Button>
            <Button size="sm" variant="outline" onClick={sendCtrlZ} title="Suspend" className="text-xs px-2 hidden sm:inline-flex">
              ^Z
            </Button>
            <Button size="sm" variant="outline" onClick={sendCtrlL} title="Clear screen" className="text-xs px-2 hidden sm:inline-flex">
              ^L
            </Button>
          </div>

          {/* Preset Commands */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))] self-center mr-1 hidden sm:inline">
              Presets:
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('ls -la\r')}
              className="text-xs px-2"
            >
              ls
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('pwd\r')}
              className="text-xs px-2"
            >
              pwd
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('clear\r')}
              className="text-xs px-2"
            >
              clear
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('exit\r')}
              className="text-xs px-2"
            >
              exit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('/compact\r')}
              title="Claude compact command"
              className="text-xs px-2 hidden sm:inline-flex"
            >
              /compact
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('y\r')}
            >
              y (yes)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendToTerminal('n\r')}
            >
              n (no)
            </Button>
          </div>
        </div>
      )}

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 bg-[#111111]"
        style={{
          minHeight: fullscreen
            ? `calc(100vh - ${showExternalInput ? '180px' : '48px'})`
            : '500px'
        }}
      />
    </div>
  )
}
