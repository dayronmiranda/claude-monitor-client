import type {
  APIResponse,
  HostInfo,
  Project,
  Session,
  SessionMessage,
  Terminal,
  TerminalConfig,
  GlobalAnalytics,
  ProjectAnalytics,
  DirectoryListing,
} from '@/types'

export class APIClient {
  private baseUrl: string
  private username: string
  private password: string

  constructor(url: string, username: string, password: string) {
    this.baseUrl = url.replace(/\/$/, '')
    this.username = username
    this.password = password
  }

  private get headers(): HeadersInit {
    const auth = btoa(`${this.username}:${this.password}`)
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Host
  async getHost(): Promise<APIResponse<HostInfo>> {
    return this.request('/api/host')
  }

  async getHealth(): Promise<{ status: string; timestamp: string; uptime: string }> {
    return this.request('/api/health')
  }

  // Projects
  async listProjects(): Promise<APIResponse<Project[]>> {
    return this.request('/api/projects')
  }

  async getProject(path: string): Promise<APIResponse<Project>> {
    return this.request(`/api/projects/${encodeURIComponent(path)}`)
  }

  async deleteProject(path: string): Promise<APIResponse<{ message: string }>> {
    return this.request(`/api/projects/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
  }

  async getProjectActivity(path: string): Promise<APIResponse<{ date: string; messages: number; sessions: number }[]>> {
    return this.request(`/api/projects/${encodeURIComponent(path)}/activity`)
  }

  // Sessions
  async listSessions(projectPath: string): Promise<APIResponse<Session[]>> {
    return this.request(`/api/projects/${encodeURIComponent(projectPath)}/sessions`)
  }

  async getSession(projectPath: string, sessionId: string): Promise<APIResponse<Session>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/${sessionId}`
    )
  }

  async deleteSession(projectPath: string, sessionId: string): Promise<APIResponse<{ message: string }>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/${sessionId}`,
      { method: 'DELETE' }
    )
  }

  async renameSession(projectPath: string, sessionId: string, name: string): Promise<APIResponse<Session>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/${sessionId}/rename`,
      {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }
    )
  }

  async deleteMultipleSessions(
    projectPath: string,
    sessionIds: string[]
  ): Promise<APIResponse<{ deleted: number }>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/delete`,
      {
        method: 'POST',
        body: JSON.stringify({ session_ids: sessionIds }),
      }
    )
  }

  async cleanEmptySessions(projectPath: string): Promise<APIResponse<{ deleted: number }>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/clean`,
      { method: 'POST' }
    )
  }

  async importSession(
    projectPath: string,
    sessionId: string,
    name?: string
  ): Promise<APIResponse<{ session_id: string; name: string }>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/import`,
      {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, name }),
      }
    )
  }

  async getSessionMessages(
    projectPath: string,
    sessionId: string
  ): Promise<APIResponse<SessionMessage[]>> {
    return this.request(
      `/api/projects/${encodeURIComponent(projectPath)}/sessions/${sessionId}/messages`
    )
  }

  // Terminals
  async listTerminals(): Promise<APIResponse<Terminal[]>> {
    return this.request('/api/terminals')
  }

  async createTerminal(config: TerminalConfig): Promise<APIResponse<Terminal>> {
    return this.request('/api/terminals', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async getTerminal(id: string): Promise<APIResponse<Terminal>> {
    return this.request(`/api/terminals/${id}`)
  }

  async deleteTerminal(id: string): Promise<APIResponse<{ message: string }>> {
    return this.request(`/api/terminals/${id}`, { method: 'DELETE' })
  }

  async killTerminal(id: string): Promise<APIResponse<{ message: string }>> {
    return this.request(`/api/terminals/${id}/kill`, { method: 'POST' })
  }

  async resumeTerminal(id: string): Promise<APIResponse<Terminal>> {
    return this.request(`/api/terminals/${id}/resume`, { method: 'POST' })
  }

  async resizeTerminal(
    id: string,
    rows: number,
    cols: number
  ): Promise<APIResponse<{ message: string }>> {
    return this.request(`/api/terminals/${id}/resize`, {
      method: 'POST',
      body: JSON.stringify({ rows, cols }),
    })
  }

  getTerminalWSUrl(id: string): string {
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws'
    const wsUrl = this.baseUrl.replace(/^https?/, wsProtocol)
    return `${wsUrl}/api/terminals/${id}/ws?user=${encodeURIComponent(this.username)}&pass=${encodeURIComponent(this.password)}`
  }

  // Analytics
  async getGlobalAnalytics(refresh = false): Promise<APIResponse<GlobalAnalytics>> {
    const query = refresh ? '?refresh=true' : ''
    return this.request(`/api/analytics/global${query}`)
  }

  async getProjectAnalytics(
    path: string,
    refresh = false
  ): Promise<APIResponse<ProjectAnalytics>> {
    const query = refresh ? '?refresh=true' : ''
    return this.request(`/api/analytics/projects/${encodeURIComponent(path)}${query}`)
  }

  async invalidateCache(project?: string): Promise<APIResponse<{ message: string }>> {
    return this.request('/api/analytics/invalidate', {
      method: 'POST',
      body: JSON.stringify({ project }),
    })
  }

  // Filesystem
  async listDirectory(path: string): Promise<APIResponse<DirectoryListing>> {
    return this.request(`/api/filesystem/dir?path=${encodeURIComponent(path)}`)
  }
}
