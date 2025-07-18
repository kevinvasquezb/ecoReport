# 🌱 EcoReports - Plataforma Inteligente de Monitoreo de Residuos Urbanos

<div align="center">

![EcoReports Logo](https://img.shields.io/badge/EcoReports-1.0.0-brightgreen?style=for-the-badge&logo=leaf)

**Conectando ciudadanos y autoridades para ciudades más limpias y sostenibles**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.2.7-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Demo en Vivo](https://ecoreports.vercel.app) • [Documentación API](./docs/api.md) • [Reportar Bug](https://github.com/kevinvasquezb/ecoReport/issues)

</div>

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [📱 Uso de la Aplicación](#-uso-de-la-aplicación)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [📊 Base de Datos](#-base-de-datos)
- [🌐 API Endpoints](#-api-endpoints)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [🚢 Deploy a Producción](#-deploy-a-producción)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

---

## 🎯 Descripción del Proyecto

**EcoReports** es una plataforma web progresiva (PWA) que facilita el reporte y gestión de residuos urbanos, conectando a ciudadanos comprometidos con autoridades municipales para crear ciudades más limpias y sostenibles.

### 🌍 Problema que Resuelve

- **Ciudadanos**: No tienen una forma fácil y efectiva de reportar acumulación de basura
- **Autoridades**: Carecen de visibilidad en tiempo real de problemas urbanos
- **Sistema actual**: Datos desactualizados, gestión ineficiente, falta de participación ciudadana

### 💡 Nuestra Solución

Una plataforma integral que:
- ✅ Permite reportes ciudadanos con foto + GPS
- ✅ Ofrece dashboard centralizado para autoridades  
- ✅ Incluye análisis inteligente de imágenes (IA)
- ✅ Gamifica la participación ciudadana
- ✅ Automatiza flujos de notificaciones

### 🎯 Contribución a los ODS

- **ODS 11**: Ciudades y Comunidades Sostenibles
- **ODS 12**: Producción y Consumo Responsable

---

## ✨ Características Principales

### 👥 Para Ciudadanos
- 📸 **Reportes con Cámara**: Captura directa desde móvil con GPS automático
- 🗺️ **Mapa Interactivo**: Visualiza reportes cercanos en tiempo real
- 🏆 **Sistema de Gamificación**: Gana puntos y niveles por participar
- 📱 **PWA**: Instala como app nativa, funciona offline
- 🔔 **Notificaciones Push**: Recibe actualizaciones de tus reportes

### 🏛️ Para Autoridades
- 📊 **Dashboard Centralizado**: Vista completa de todos los reportes
- 📈 **Métricas en Tiempo Real**: KPIs y estadísticas de la ciudad
- 🔄 **Gestión de Estados**: Actualiza el progreso de limpieza
- 👥 **Asignación de Cuadrillas**: Organiza equipos de trabajo
- 📋 **Reportes y Análisis**: Exporta datos para toma de decisiones

### 🤖 Tecnología Avanzada
- 🧠 **IA para Análisis**: Clasificación automática de residuos con Ollama
- ⚡ **Automatización**: Flujos inteligentes con n8n
- 📱 **Tiempo Real**: WebSockets para actualizaciones instantáneas
- 🌐 **Geolocalización**: PostGIS para análisis espacial avanzado

---

## 🛠️ Tecnologías Utilizadas

### Frontend
```json
{
  "framework": "React 18.2.0",
  "styling": "TailwindCSS 3.2.7",
  "maps": "Leaflet + OpenStreetMap",
  "pwa": "Service Workers",
  "state": "Context API",
  "http": "Axios",
  "icons": "Lucide React"
}
```

### Backend
```json
{
  "runtime": "Node.js 18.x LTS",
  "framework": "Express 4.18.2",
  "database": "PostgreSQL 16 + PostGIS",
  "auth": "JWT + bcryptjs",
  "files": "Multer + Cloudinary",
  "security": "Helmet + CORS"
}
```

### IA y Automatización
```json
{
  "ai_model": "Ollama (llava:7b) - Local y Gratuito",
  "automation": "n8n.cloud - 5,000 ops/mes gratis",
  "notifications": "Telegram Bot API",
  "image_processing": "Cloudinary"
}
```

### Deploy (100% Gratuito)
```json
{
  "frontend": "Vercel (100GB bandwidth/mes)",
  "backend": "Railway (1GB BD, 500h CPU/mes)", 
  "images": "Cloudinary (25GB storage)",
  "automation": "n8n.cloud",
  "maps": "OpenStreetMap + Leaflet"
}
```

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Node.js** 18.x LTS o superior
- **PostgreSQL** 16 o superior
- **Git** para control de versiones
- **Cuenta Cloudinary** (gratuita)

### 🔧 Configuración Paso a Paso

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/kevinvasquezb/ecoReport.git
cd ecoReport
```

#### 2. Configurar Backend
```bash
# Navegar al backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

#### 3. Configurar Base de Datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE ecoreports_db;

# Ejecutar schema
psql -U postgres -d ecoreports_db -f database/schema.sql
```

#### 4. Configurar Frontend
```bash
# Navegar al frontend
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Configurar variables del frontend
nano .env
```

#### 5. Obtener Credenciales Cloudinary
1. Ve a [Cloudinary](https://cloudinary.com)
2. Crea una cuenta gratuita
3. Copia: `Cloud Name`, `API Key`, `API Secret`
4. Pégalos en tu archivo `.env`

### ▶️ Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

**URLs de Desarrollo:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 📱 Uso de la Aplicación

### 👤 Para Ciudadanos

1. **Registro/Login**
   - Crea tu cuenta con email y contraseña
   - Verifica tu email (próximamente)

2. **Crear Reporte**
   - Toca "Reportar" en la navegación inferior
   - Toma foto o selecciona de galería
   - El GPS detecta automáticamente la ubicación
   - Agrega descripción del problema
   - Envía el reporte

3. **Ver Progreso**
   - Revisa tus reportes en "Mis Reportes"
   - Ve el mapa para reportes cercanos
   - Recibe notificaciones de actualizaciones

4. **Ganar Puntos**
   - Gana puntos por cada reporte verificado
   - Sube de nivel (Novato → Experto → Maestro)
   - Compite en el leaderboard semanal

### 🏛️ Para Autoridades

1. **Dashboard**
   - Vista general de todos los reportes
   - Métricas y KPIs en tiempo real
   - Mapa de calor de problemas

2. **Gestionar Reportes**
   - Cambiar estado: Reportado → En Proceso → Limpio
   - Asignar cuadrillas de limpieza
   - Agregar comentarios oficiales

3. **Análisis**
   - Exportar reportes a Excel/PDF
   - Ver tendencias y patrones
   - Planificar rutas de limpieza

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   SERVICIOS     │
│   React PWA     │◄──►│   Node.js API   │◄──►│   EXTERNOS      │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express       │    │ • Cloudinary    │
│ • TailwindCSS   │    │ • PostgreSQL    │    │ • n8n           │
│ • Leaflet Maps  │    │ • JWT Auth      │    │ • Ollama IA     │
│ • Service Worker│    │ • WebSockets    │    │ • Telegram      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔄 Flujo de Datos

1. **Usuario crea reporte** → Frontend captura datos + imagen
2. **Frontend envía** → Backend via API REST
3. **Backend procesa** → Valida, guarda en PostgreSQL, sube imagen a Cloudinary
4. **Automatización** → n8n webhook → Ollama IA analiza imagen
5. **Notificación** → Telegram Bot notifica autoridades si es urgente
6. **Tiempo real** → WebSocket actualiza frontend automáticamente

---

## 📊 Base de Datos

### 🗂️ Diagrama ERD

```sql
usuarios                    reportes                   notificaciones
├── id (PK)                ├── id (PK)                ├── id (PK)
├── email                  ├── usuario_id (FK)        ├── usuario_id (FK)
├── password_hash          ├── latitud                ├── reporte_id (FK)
├── nombre                 ├── longitud               ├── tipo
├── telefono               ├── descripcion            ├── mensaje
├── role                   ├── imagen_url             ├── leida
├── puntos                 ├── estado                 └── created_at
├── nivel                  ├── ai_analisis
└── created_at             └── created_at
```

### 📋 Tablas Principales

- **usuarios**: Información de ciudadanos y autoridades
- **reportes**: Reportes de residuos con geolocalización
- **notificaciones**: Sistema de alertas y actualizaciones
- **categorias_residuos**: Tipos de residuos predefinidos
- **cuadrillas**: Equipos de limpieza asignados

---

## 🌐 API Endpoints

### 🔐 Autenticación
```http
POST   /api/auth/register     # Registro de usuario
POST   /api/auth/login        # Inicio de sesión
GET    /api/auth/profile      # Perfil del usuario
```

### 📋 Reportes
```http
GET    /api/reportes          # Listar reportes
POST   /api/reportes          # Crear reporte
GET    /api/reportes/:id      # Obtener reporte específico
PATCH  /api/reportes/:id      # Actualizar estado (autoridades)
```

### 🔔 Notificaciones
```http
GET    /api/notifications     # Listar notificaciones
PATCH  /api/notifications/:id/read  # Marcar como leída
```

### 📊 Estadísticas
```http
GET    /api/stats/user        # Estadísticas del usuario
GET    /api/stats/dashboard   # Métricas para autoridades
```

📖 **Documentación completa**: [Ver API Docs](./docs/api.md)

---

## 🔧 Scripts Disponibles

### Backend
```bash
npm start          # Producción
npm run dev        # Desarrollo con nodemon
npm test           # Ejecutar tests
npm run migrate    # Ejecutar migraciones
npm run seed       # Datos de ejemplo
```

### Frontend
```bash
npm start          # Servidor de desarrollo
npm run build      # Build para producción
npm test           # Ejecutar tests
npm run analyze    # Analizar bundle
```

---

## 🚢 Deploy a Producción

### 🌐 Frontend (Vercel)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### ⚡ Backend + DB (Railway)
```bash
# Conectar con Railway
railway login
railway init
railway up
```

### 🔧 Variables de Entorno
```bash
# Frontend (Vercel)
REACT_APP_API_URL=https://tu-backend.railway.app

# Backend (Railway)
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-super-fuerte
CLOUDINARY_CLOUD_NAME=tu-cloud-name
# ... resto de variables
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### 📋 Guías de Contribución
- [Código de Conducta](./CODE_OF_CONDUCT.md)
- [Guía de Contribución](./CONTRIBUTING.md)
- [Reportar Bugs](./docs/bug-report-template.md)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Kevin Vásquez**
- GitHub: [@kevinvasquezb](https://github.com/kevinvasquezb)
- LinkedIn: [Kevin Vásquez](https://linkedin.com/in/kevinvasquezb)
- Email: kevin@ecoreports.com

---

## 🙏 Agradecimientos

- [OpenStreetMap](https://openstreetmap.org) por los mapas gratuitos
- [Cloudinary](https://cloudinary.com) por el almacenamiento de imágenes
- [Vercel](https://vercel.com) y [Railway](https://railway.app) por el hosting gratuito
- [Lucide](https://lucide.dev) por los iconos hermosos

---

<div align="center">

**⭐ Si este proyecto te ayudó, considera darle una estrella en GitHub ⭐**

**🌱 Juntos construimos ciudades más limpias 🌱**

</div>