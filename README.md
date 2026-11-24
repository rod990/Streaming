# Plataforma Global de Streaming (Caso 8) - Evaluación 2

Aplicación web Full-Stack de streaming con autenticación JWT, roles (`admin` y `suscriptor`), base de datos PostgreSQL con Seeder automático e integración con API externa de búsqueda de videos.

## Guía de Instalación y Despliegue Local

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/rod990/Streaming.git
cd Streaming
```

### Paso 2: Preparar la base de datos
1. Abra **pgAdmin**.
2. Cree una base de datos nueva y vacía llamada: `streaming_db`

### Paso 3: Configurar y poblar el Backend
```bash
cd backend
npm install
```
Edite `backend/.env` con su contraseña local de PostgreSQL y ejecute:
```bash
npm run seed
```

### Paso 4: Iniciar el sistema (2 terminales)
- **Terminal 1 (Backend):** `cd backend && npm start` (Puerto 3000)
- **Terminal 2 (Frontend):** `cd frontend && npm install && npm start` (Puerto 3001)

### Paso 5: Credenciales de prueba
- **Administrador:** `admin@streaming.cl` / `123456`
- **Suscriptor:** `usuario@streaming.cl` / `123456`
