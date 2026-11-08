# 🛰️ TRACE — Application Workspace

> **NASA International Space Apps Challenge 2026** | **Track:** [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/?tab=details)  
> *For the complete scientific vision, system architecture diagrams, and challenge alignment, please see the [Root Master README](../README.md).*

---

## ⚡ Quick Navigation

- [System Architecture](docs/ARCHITECTURE.md)
- [API Specifications](docs/API.md)
- [Database Schema & RLS Policies](docs/DATABASE_SCHEMA.md)
- [Requirements Traceability Matrix](docs/REQUIREMENTS_TRACEABILITY.md)
- [Development Setup Guide](docs/DEVELOPMENT_SETUP.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)

---

## 🛠️ Development Quickstart

### 1. Requirements
- Node.js 20.9+ and npm 10+
- Configured Supabase project with Email/Password Auth

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and define your project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
PORT=8000
```

### 3. Database Migration
Apply the PostgreSQL migration:
```bash
# Path: supabase/migrations/202610300001_trace_core.sql
```
This migration provisions `missions`, `observations`, Row-Level Security (RLS) policies, storage buckets, and the `restore_trace_records` transactional RPC.

### 4. Running the Development Stack
```powershell
npm ci
npm run dev
```
- Frontend (Next.js 15): [http://localhost:3000](http://localhost:3000)
- Backend API (Express 5): [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🧪 Verification & Quality Checks

Run the full testing and static analysis pipeline:
```powershell
npm run lint          # ESLint code quality audit
npm run typecheck     # Strict TypeScript type evaluation
npm test              # Client-side unit and schema tests
npm run test:server   # Express API and security middleware tests
npm run build         # Next.js production build verification
```

---

## 🔒 Data Sovereignty & Security Note

Missions and ground observations are isolated at the database engine level via PostgreSQL Row Level Security (RLS). The Express API communicates using user-delegated tokens; no administrative service-role key is ever exposed or used during runtime.
