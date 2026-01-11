// API Response wrapper
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: APIMeta
}

export interface APIMeta {
  total?: number
  offset?: number
  limit?: number
}

// Host/Driver
export interface Host {
  id: string
  name: string
  url: string
  username: string
  password: string
  status: 'online' | 'offline' | 'connecting'
  info?: HostInfo
}

export interface HostInfo {
  id: string
  name: string
  version: string
  platform: string
  arch: string
  claude_dir: string
  started_at: string
  uptime: string
  stats: HostStats
}

export interface HostStats {
  active_terminals: number
  total_projects: number
  total_sessions: number
}

// Project
export interface Project {
  id: string
  path: string
  real_path: string
  session_count: number
  last_modified: string
  total_messages?: number
  total_size?: number
  empty_sessions?: number
}

// Session (Claude session from .claude/projects)
export interface Session {
  id: string
  name?: string
  project_path: string
  real_path: string
  file_path: string
  first_message: string
  message_count: number
  size_bytes: number
  created_at: string
  modified_at: string
}

// Session Message
export interface SessionMessage {
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  todos?: unknown[]
}

// Terminal (active PTY session)
export interface Terminal {
  id: string
  name: string
  work_dir: string
  session_id?: string
  type: 'claude' | 'terminal'
  status: 'running' | 'stopped' | 'error'
  model?: string
  active: boolean
  clients: number
  can_resume: boolean
  started_at?: string
  created_at?: string
  last_access_at?: string
}

export interface TerminalConfig {
  id?: string
  name?: string
  work_dir: string
  type?: 'claude' | 'terminal'
  command?: string
  model?: string
  system_prompt?: string
  allowed_tools?: string[]
  disallowed_tools?: string[]
  permission_mode?: string
  additional_dirs?: string[]
  resume?: boolean
  continue?: boolean
  dangerously_skip?: boolean
}

// Analytics
export interface GlobalAnalytics {
  total_projects: number
  total_sessions: number
  total_messages: number
  total_size_bytes: number
  empty_sessions: number
  active_days: number
  projects_summary: ProjectSummary[]
  daily_activity: DailyActivity[]
  last_updated: string
  cached_until: string
}

export interface ProjectSummary {
  path: string
  real_path: string
  sessions: number
  messages: number
  size_bytes: number
  empty_sessions: number
  last_activity: string
}

export interface ProjectAnalytics {
  path: string
  real_path: string
  total_sessions: number
  total_messages: number
  total_size_bytes: number
  empty_sessions: number
  daily_activity: DailyActivity[]
  top_days: DailyActivity[]
  last_updated: string
  cached_until: string
}

export interface DailyActivity {
  date: string
  messages: number
  sessions: number
}

// Filesystem
export interface DirectoryEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
}

export interface DirectoryListing {
  current_path: string
  entries: DirectoryEntry[]
}

// WebSocket messages
export interface WSMessage {
  type: 'output' | 'input' | 'resize' | 'status' | 'closed' | 'error'
  data?: string
  message?: string
  rows?: number
  cols?: number
}
