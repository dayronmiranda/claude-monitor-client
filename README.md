# Claude Monitor Client

Cliente web para **Claude Monitor** - Sistema para visualizar el historial completo de conversaciones con Claude.

## 🎯 Características

- 🖥️ Interfaz moderna con React 19 + TypeScript
- 📱 Diseño responsive (Mobile-first)
- 🎨 Tema oscuro con Tailwind CSS
- 🔌 Gestión de múltiples drivers (hosts remotos)
- 📊 Dashboard con estadísticas
- 📋 Listado de proyectos y sesiones
- **💬 Visualización completa de historial de chat**
- ✏️ Edición de nombres de sesiones
- 🗑️ Eliminación y limpieza de sesiones
- 🔧 Control de terminales PTY
- 📈 Analytics global y por proyecto

## 📖 Historial de Chat

Cada sesión muestra:
- ✅ Mensajes de usuario (verde, derecha)
- ✅ Respuestas del asistente (gris, izquierda)
- ✅ Pensamientos internos (💭 "PENSAMIENTO")
- ✅ Archivos leídos (🔍 Read)
- ✅ Cambios realizados (✏️ Edit con antes/después)
- ✅ Comandos ejecutados (🔧 Bash)
- ✅ Resultados de herramientas (✅ OK o ❌ Error)
- ✅ Listas de TODOs (📋)
- ✅ Timestamps de cada mensaje

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o pnpm
- Backend corriendo en http://localhost:9090

### Instalación

```bash
npm install
npm run dev
```

Abre http://localhost:9001

### Compilar para Producción

```bash
npm run build
npm run preview
```

## 📁 Estructura

```
src/
├── components/
│   ├── layout/          # Layout principal
│   ├── hosts/          # Gestión de drivers
│   ├── projects/       # Listado de proyectos
│   ├── sessions/       # Listado de sesiones
│   │   ├── SessionsPage.tsx         # Listado
│   │   └── SessionMessagesPage.tsx  # Historial completo
│   ├── terminals/      # Control de terminales
│   ├── analytics/      # Estadísticas
│   ├── settings/       # Configuración
│   └── ui/             # Componentes reutilizables
├── services/
│   └── api.ts         # Cliente HTTP para API
├── stores/
│   ├── useStore.ts    # Estado global (hosts, sesiones)
│   └── useTerminalStore.ts
├── types/
│   └── index.ts       # TypeScript interfaces
├── lib/
│   └── utils.ts       # Utilidades
└── main.tsx           # Punto de entrada
```

## 🔌 API Client

El cliente comunica con el backend mediante `APIClient`:

```typescript
// En src/services/api.ts
class APIClient {
  async listProjects(): Promise<APIResponse<Project[]>>
  async listSessions(projectPath: string): Promise<APIResponse<Session[]>>
  async getSessionMessages(projectPath: string, sessionId: string): Promise<APIResponse<SessionMessage[]>>
  // ... más métodos
}
```

## 📝 Rutas (React Router)

```
/                           # Hosts (Drivers)
/projects                   # Listado de proyectos
/projects/:projectPath      # Sesiones del proyecto
/projects/:projectPath/sessions/:sessionId/messages  # Historial
/terminals                  # Control de terminales
/terminals/:terminalId      # Terminal específica
/analytics                  # Estadísticas
/settings                   # Configuración
```

## 🎨 Temas y Estilos

### Variables CSS (src/index.css)

```css
:root {
  --background: 0 0% 7%;        /* #121212 */
  --foreground: 0 0% 95%;       /* #F2F2F2 */
  --primary: 142 76% 45%;       /* #2ECC71 (Verde) */
  --secondary: 0 0% 15%;        /* #262626 */
  --destructive: 0 84% 60%;     /* #FF5555 (Rojo) */
}
```

## 📊 Estado Global (Zustand)

Gestión de estado con Zustand:
- Hosts (drivers) y sus credenciales
- API clients activos
- Host activo seleccionado
- Persistencia en localStorage

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de build
npm run lint     # Linting con ESLint
```

### Dependencias Principales

- **react** 19.0.0 - Framework
- **react-router-dom** 7.12.0 - Enrutamiento
- **zustand** 5.0.9 - Estado global
- **tailwindcss** 4.1.18 - Estilos
- **lucide-react** 0.562.0 - Iconos
- **xterm.js** 6.0.0 - Emulador de terminal

## 📱 Responsive Design

- **Mobile**: Collapsa sidebar, aumenta padding
- **Tablet**: Layout flexible
- **Desktop**: Sidebar fijo

## 🔐 Seguridad

- Autenticación Basic Auth (configurada por cliente)
- CORS habilitado
- Validación de inputs
- Manejo seguro de credenciales en state

## 📈 Performance

- Code splitting automático con Vite
- Lazy loading de rutas
- Virtualización de listas largas (si necesario)
- Cache de API responses

## 📝 Commits Principales

```
✓ refactor: Cambiar modal de historial a página completa
✓ feat: Mostrar TODOs en el historial de mensajes
✓ feat: Agregar visualización de historial de mensajes en sesiones
```

## 📄 Licencia

MIT

## 👤 Autor

[dayronmiranda](https://github.com/dayronmiranda)

---

**Repositorio**: https://github.com/dayronmiranda/claude-monitor-client

**Backend**: https://github.com/dayronmiranda/claude-monitor
