import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { DirectoryBrowser } from '@/components/filesystem/DirectoryBrowser'
import type { JobConfig } from '@/types'

interface CreateJobDialogProps {
  onClose: () => void
  onCreate: (config: JobConfig) => void
}

export function CreateJobDialog({ onClose, onCreate }: CreateJobDialogProps) {
  const [showDirBrowser, setShowDirBrowser] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    work_dir: '',
    type: 'claude' as 'claude' | 'terminal',
    model: 'claude-3.5-sonnet',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.work_dir.trim()) {
      newErrors.work_dir = 'El directorio es requerido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onCreate({
      name: formData.name || undefined,
      description: formData.description || undefined,
      work_dir: formData.work_dir,
      type: formData.type,
      model: formData.model,
    })

    onClose()
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Crear Nuevo Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre (opcional)
              </label>
              <Input
                placeholder="Mi nuevo trabajo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción (opcional)
              </label>
              <Input
                placeholder="Describe qué harás en este trabajo..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Directorio de trabajo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Directorio de Trabajo <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="/var/www/mi-proyecto"
                    value={formData.work_dir}
                    onChange={(e) =>
                      setFormData({ ...formData, work_dir: e.target.value })
                    }
                    className={errors.work_dir ? 'border-red-500' : ''}
                  />
                  {errors.work_dir && (
                    <p className="mt-1 text-xs text-red-500">{errors.work_dir}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDirBrowser(true)}
                  title="Explorar directorios"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tipo de trabajo */}
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'claude' | 'terminal',
                  })
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="claude">Claude</option>
                <option value="terminal">Terminal Bash</option>
              </select>
            </div>

            {/* Modelo */}
            {formData.type === 'claude' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Modelo Claude
                </label>
                <select
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </select>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button type="submit">Crear Trabajo</Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Directory Browser Dialog */}
      <Dialog
        open={showDirBrowser}
        onClose={() => setShowDirBrowser(false)}
        title="Seleccionar Directorio de Trabajo"
      >
        <DirectoryBrowser
          initialPath={formData.work_dir || '/root'}
          onSelect={(path) => {
            setFormData({ ...formData, work_dir: path })
            setShowDirBrowser(false)
          }}
          onCancel={() => setShowDirBrowser(false)}
        />
      </Dialog>
    </>
  )
}
