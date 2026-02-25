# Alzheon

Sistema de monitoreo y análisis cognitivo para pacientes con Alzheimer. Permite a pacientes, cuidadores y médicos colaborar en el seguimiento de la evolución cognitiva mediante grabaciones de voz, análisis con IA, gestión de fotos y **gestión de documentos cognitivos con firma**.

## Novedades (Módulo Cognitivo – Documentos, Firmas y Análisis IA)

### Funcionalidades
- **Paciente**
  - Ver asignaciones de plantillas cognitivas.
  - Firmar directamente en la página (canvas) y subir el resultado.
  - Descargar/Imprimir plantillas en PDF y subir el documento firmado (PDF/JPG/PNG).
  - Generación automática de **análisis IA (Gemini)** al subir resultados (cuando aplica).
- **Médico**
  - Asignar plantillas cognitivas a pacientes (frecuencia y fechas).
  - Ver y descargar los archivos subidos por el paciente.
  - Ver el **análisis IA (Gemini)** asociado a cada archivo (si existe).
- **Cuidador**
  - Ver y descargar los archivos subidos por el paciente.
  - Ver el **análisis IA (Gemini)** asociado a cada archivo (si existe y según permisos).

### Rutas (Frontend)
- Paciente: `/paciente/documentos`
- Médico:
  - Asignar plantilla: `/medico/pacientes/:id/asignar-plantilla`
  - Ver documentos del paciente: dentro del detalle del paciente (tab “Documentos”)
- Cuidador: `/cuidador/documentos`

---

## Endpoints (Backend – v2)

### Plantillas y asignaciones
- `GET /api/v2/plantillas` (médico)
- `POST /api/v2/asignar/paciente/:idPaciente` (médico)
- `GET /api/v2/mis/asignaciones` (paciente/cuidador)

### Resultados (submissions)
- `POST /api/v2/resultados/asignacion/:idAsignacion` (paciente/cuidador, `multipart/form-data`, campo `file`)
- `GET /api/v2/resultados/paciente/:idPaciente` (médico)
  - (opcional) cuidador según permisos del backend

### Archivos estáticos
- Plantillas PDF: `/assets/templates/*`
- Resultados subidos: `/uploads/*`

---

## Análisis IA (Gemini) – Formato esperado

El backend guarda el análisis dentro del campo `analisisIA` del submission. **El JSON clínico final está anidado en `analisisIA.resultadoJson`.**

### Estructura de `analisisIA`
```json
{
  "estado": "completado|omitido|fallido",
  "modelo": "gemini-2.5-flash",
  "generadoEn": "2026-02-25T21:55:29.848Z",
  "resultadoJson": {
    "tipoPrueba": "firma|dibujo|otro",
    "resumenObservacional": "string",
    "indicadores": [
      {
        "nombre": "legibilidad|alineacion|coherencia_trazo|estructura_dibujo|orientacion_temporal|motricidad_fina|otro",
        "observacion": "string",
        "nivel": "bajo|medio|alto|no_evaluable"
      }
    ],
    "comparabilidadFutura": {
      "util": true,
      "motivo": "string"
    },
    "alertas": ["string"],
    "calidadArchivo": {
      "nivel": "buena|media|baja",
      "motivo": "string"
    },
    "recomendacionParaMedico": "string",
    "descargo": "Análisis automatizado de apoyo, no reemplaza criterio médico."
  },
  "resultadoTexto": "string (opcional)",
  "error": "string (si estado=omitido|fallido)"
}
```

### Estados posibles
- `completado`: existe `resultadoJson` y se debe renderizar el análisis.
- `omitido`: no se generó análisis (ej: tipo de archivo no soportado, tamaño 0, configuración faltante). Puede traer `error`.
- `fallido`: hubo un error en la ejecución. Debe mostrarse `error` y permitir inspección del archivo igualmente.

> Nota: en algunos registros antiguos se observó error por variable de entorno no configurada, ejemplo: `GEMINI_API_KEY_VILA no configurada`.

---

## Inicialización del Proyecto

### Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/TUPROYECTO
cd TUPROYECTO
```

#### 2. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:
```env
MONGO_URI=tu_cadena_de_conexión
PORT=5500
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
GEMINI_API_KEY_VILA=tu_otro_api
GEMINI_MODEL_VILA=tu_modelo

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
VITE_BACKEND_URL=http://localhost:5500
```

Iniciar la aplicación:
```bash
npm run dev
```

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
