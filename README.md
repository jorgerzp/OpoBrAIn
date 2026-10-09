# 🏛️ OpoBrAIn - Preparación Oposiciones C1 Estado

Plataforma Web Full-Stack para la preparación de las **Oposiciones al Cuerpo General Administrativo del Estado (C1)**.
Diseñada y optimizada para operar al 100% en el **Free Tier**:
- **Base de Datos**: PostgreSQL Serverless en [Neon.tech](https://neon.tech)
- **Backend API**: Node.js + Express en [Render](https://render.com)
- **Frontend**: React (Vite) + Tailwind CSS + Zustand + Framer Motion en [Vercel](https://vercel.com)

---

## 📂 Arquitectura del Proyecto

```text
OpoBrAIn/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Pool de conexiones pg optimizado para Neon
│   │   ├── controllers/
│   │   │   ├── temas.controller.js   # Lógica del temario C1
│   │   │   └── test.controller.js    # Tests oficiales, por tema, repaso y UPSERT
│   │   ├── db/
│   │   │   ├── schema.sql            # Tablas con UUIDs e índices
│   │   │   └── seed.sql              # Preguntas y temas reales de la oposición C1
│   │   ├── routes/
│   │   │   ├── temas.routes.js       # Rutas /api/temas
│   │   │   └── test.routes.js        # Rutas /api/test
│   │   └── server.js                 # Entrada Express, CORS, health-check
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx         # Pantalla principal con Recharts
│   │   │   └── TestRunner.jsx        # Ejecutor interactivo con Framer Motion
│   │   ├── services/
│   │   │   └── api.js                # Consumo de API y modo de respaldo offline
│   │   ├── store/
│   │   │   └── useTestStore.js       # Estado global con Zustand
│   │   ├── App.jsx
│   │   ├── index.css                 # Estilos Tailwind + Glassmorphism
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Puesta en Marcha Rápida (Local)

### 1. Base de Datos (Neon)
1. Crea un proyecto gratuito en [Neon](https://neon.tech).
2. Ve al SQL Editor en Neon y ejecuta:
   - `backend/src/db/schema.sql`
   - `backend/src/db/seed.sql`
3. Copia la cadena de conexión (Connection String).

### 2. Backend (Node.js + Express)
```bash
cd backend
npm install
cp .env.example .env
# Pega tu DATABASE_URL de Neon en el archivo .env
npm run dev
```
El servidor arrancará en `http://localhost:5000`.

### 3. Frontend (React + Vite)
```bash
cd ../frontend
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:3000` con proxy automático a `http://localhost:5000`.
