import { APIClient } from '@/services/api'
import type { Job, JobConfig, JobState } from '@/types'

export class JobsClient {
  client: APIClient

  constructor(client: APIClient) {
    this.client = client
  }

  /**
   * Obtiene lista de trabajos de un proyecto
   */
  async getJobs(projectPath: string, state?: JobState): Promise<Job[]> {
    let url = `/api/projects/${encodeURIComponent(projectPath)}/jobs`
    if (state) {
      url += `?state=${state}`
    }
    const response = await this.client.makeRequest(url)
    return response.data || []
  }

  /**
   * Obtiene un trabajo específico
   */
  async getJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}`
    )
    return response.data
  }

  /**
   * Crea un nuevo trabajo
   */
  async createJob(projectPath: string, config: JobConfig): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs`,
      { method: 'POST', body: JSON.stringify(config) }
    )
    return response.data
  }

  /**
   * Elimina un trabajo
   */
  async deleteJob(projectPath: string, jobId: string): Promise<void> {
    await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Inicia un trabajo
   */
  async startJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/start`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Pausa un trabajo
   */
  async pauseJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/pause`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Reanuda un trabajo
   */
  async resumeJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/resume`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Detiene un trabajo
   */
  async stopJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/stop`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Archiva un trabajo
   */
  async archiveJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/archive`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Reabre un trabajo archivado
   */
  async reopenJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/reopen`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Reintenta un trabajo en error
   */
  async retryJob(projectPath: string, jobId: string): Promise<Job> {
    const response = await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/retry`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    return response.data
  }

  /**
   * Descarta un trabajo en error
   */
  async discardJob(projectPath: string, jobId: string): Promise<void> {
    await this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/discard`,
      { method: 'POST', body: JSON.stringify({}) }
    )
  }

  /**
   * Obtiene mensajes de conversación de un trabajo
   */
  async getJobMessages(projectPath: string, jobId: string): Promise<any> {
    return this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/messages`
    )
  }

  /**
   * Obtiene acciones disponibles para un trabajo
   */
  async getJobActions(projectPath: string, jobId: string): Promise<any> {
    return this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/${jobId}/actions`
    )
  }

  /**
   * Ejecuta una acción en lote sobre múltiples trabajos
   */
  async batchJobAction(
    projectPath: string,
    jobIds: string[],
    action: string
  ): Promise<any> {
    return this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/batch/action`,
      { method: 'POST', body: JSON.stringify({ ids: jobIds, action }) }
    )
  }

  /**
   * Elimina múltiples trabajos en lote
   */
  async batchDeleteJobs(projectPath: string, jobIds: string[]): Promise<any> {
    return this.client.makeRequest(
      `/api/projects/${encodeURIComponent(projectPath)}/jobs/batch/delete`,
      { method: 'POST', body: JSON.stringify({ ids: jobIds }) }
    )
  }
}
