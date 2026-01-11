import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Application configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Claude Monitor Client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Framework</span>
              <span>React + Vite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">UI</span>
              <span>Tailwind CSS</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>Local data management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
              Driver configurations are stored in your browser's local storage.
            </p>
            <button
              className="text-sm text-[hsl(var(--destructive))] hover:underline"
              onClick={() => {
                if (confirm('Clear all local data? This will remove all saved drivers.')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
            >
              Clear local storage
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
