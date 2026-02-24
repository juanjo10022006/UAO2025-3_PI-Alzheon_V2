# Alzheon

Sistema de monitoreo y análisis cognitivo para pacientes con Alzheimer. Permite a pacientes, cuidadores y médicos colaborar en el seguimiento de la evolución cognitiva mediante grabaciones de voz, análisis con IA, gestión de fotos y **gestión de documentos cognitivos con firma**.

## Novedades (Módulo Cognitivo – Documentos y Firmas)

### Funcionalidades
- **Paciente**
    - Ver asignaciones de plantillas cognitivas.
    - Firmar directamente en la página (canvas) y subir el resultado.
    - Descargar/Imprimir plantillas en PDF y subir el documento firmado (PDF/JPG/PNG).
- **Médico**
    - Asignar plantillas cognitivas a pacientes (frecuencia y fechas).
    - Ver y descargar los archivos subidos por el paciente.
- **Cuidador**
    - Ver y descargar los archivos subidos por el paciente (requiere habilitación de permisos en backend para lectura).

### Rutas (Frontend)
- Paciente: `/paciente/documentos`
- Médico:
    - Asignar plantilla: `/medico/pacientes/:id/asignar-plantilla`
    - Ver documentos del paciente: dentro del detalle del paciente (tab “Documentos”)
- Cuidador: `/cuidador/documentos`

### Endpoints (Backend – v2)
- `GET /api/v2/plantillas` (médico)
- `POST /api/v2/asignar/paciente/:idPaciente` (médico)
- `GET /api/v2/mis/asignaciones` (paciente/cuidador)
- `POST /api/v2/resultados/asignacion/:idAsignacion` (paciente/cuidador, multipart/form-data, campo `file`)
- `GET /api/v2/resultados/paciente/:idPaciente` (médico)
  > Para cuidador: habilitar lectura en backend si aplica a tu modelo de permisos.

### Archivos estáticos
- Plantillas PDF servidas desde: `/assets/templates/*`
- Resultados subidos: `/uploads/*`
> Alinear nombres de archivos en disco con los `assetUrl` almacenados en BD.

---

## Inicialización del Proyecto

### Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/Joseligos/PI-Alzheon.git
cd PI-Alzheon
```

#### 2. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:
```env
MONGO_URI=tu_cadena_de_conexión
PORT=8080
JWT_SECRET=tu_clave_secreta
NODE_ENV=development

# Resend API Key 
RESEND_API_KEY=tu_api

R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_api
R2_SECRET_ACCESS_KEY=tu_api
R2_BUCKET_NAME=alzheon
R2_PUBLIC_URL=tu_public_url
R2_ENDPOINT=tu_endpoint

ASSEMBLYAI_API_KEY=tu_api
GEMINI_API_KEY=tu_api

# Configuración de Análisis
UMBRAL_DESVIACION_DEFECTO=
MIN_PALABRAS_ANALISIS=

REPORT_ENCRYPTION_KEY=Hash_de_32_caracteres
```

Iniciar el servidor:
```bash
npm start
# o para desarrollo:
npm run dev
```

#### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

Crear archivo `.env` en la carpeta `frontend`:
```env
VITE_BACKEND_URL=http://localhost:8080
```

Iniciar la aplicación:
```bash
npm run dev
```
El frontend estará disponible en `http://localhost:8080` (según configuración de Vite).

---

## Estructura del Proyecto (resumen)

- **backend/**: Express, MongoDB, servicios de análisis, PDFs y uploads.
- **frontend/**: React + TS + Vite, módulos por rol (Paciente/Cuidador/Médico), servicios API, Redux.

---

## Testing

### Frontend (Cypress)
```bash
cd frontend
npm run cypress:open
npm run test:e2e
```

### Backend (Cucumber)
```bash
cd backend
npm run test:cucumber
```

---

## Tecnologías

### Backend
- Express, MongoDB/Mongoose, JWT, Multer, Cloudflare R2, Resend, AssemblyAI, Gemini

### Frontend
- React, TypeScript, Vite, Redux Toolkit, React Router, Tailwind CSS, Framer Motion, Recharts, Cypress
