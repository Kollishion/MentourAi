# MentourAi (Mentor OS) - Agentic AI Mentor Ecosystem

> **Repository:** [https://github.com/Kollishion/MentourAi.git](https://github.com/Kollishion/MentourAi.git)  
> **Tagline:** A Prerequisite-Gated, Misconception-Aware Agentic AI Mentor System.

---

## Overview

**MentourAi (Mentor OS)** is an autonomous multi-agent learning platform designed to replace passive education and naive AI chatbots with structured, prerequisite-aware cognitive mentoring.

Unlike conventional LLM tutors that provide direct answers—reinforcing superficial memorization—**Mentor OS** builds dynamic knowledge graphs from raw course materials, enforces strict prerequisite mastery thresholds, diagnoses root misconceptions, and dynamically adapts teaching strategies to each individual learner.

---

## Key Features & Differentiators

- **Autonomous Multi-Agent System:** 4 specialized agents working seamlessly in an end-to-end feedback loop.
- **Knowledge Graph Extraction:** Converts syllabus PDFs, lecture notes, transcripts, and past exam papers into structured concept nodes with prerequisite chains.
- **Prerequisite Gatekeeping ($\ge 60\%$ Mastery):** Prevents students from attempting complex topics (e.g., *Dynamic Programming*) if underlying prerequisites (e.g., *Recursion*) are lacking.
- **Deep Misconception Diagnosis:** Identifies underlying mental mistakes rather than simple right/wrong binary feedback.
- **Confidence Calibration:** Detects dangerous overconfidence (high confidence + wrong answer) and underconfidence.
- **Adaptive Socratic Tutoring:** Dynamically selects teaching strategies (**Analogy**, **Guided Practice**, **Application**, **Challenge Problem**) based on real-time mastery scores.

---

## System Architecture & Multi-Agent Pipeline

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (Vite + React 19 + TypeScript)"]
        UI["Student Dashboard & Interactive Chat UI"]
    end

    subgraph Gateway ["Backend Service (Bun / Node.js + Express 5 + Prisma)"]
        GW["Auth, User Management, Rate Limiting & Proxy"]
    end

    subgraph AI_Engine ["AI Agent Engine (Python + FastAPI + Gemma / Ollama)"]
        CA["1. Content Processing Agent"]
        ORCH["2. Orchestrator Agent"]
        DIAG["3. Diagnostic Agent"]
        TUTOR["4. Scaffolded Tutor Agent"]
        STATE[("In-Memory & DB State Store")]
    end

    UI <-->|HTTP / REST| GW
    GW <-->|Proxy / Internal HTTP| AI_Engine

    CA -->|Extracted ConceptMap| STATE
    STATE -->|Prerequisites & Mastery| ORCH
    ORCH -->|Action: Remediate / Diagnose| DIAG
    DIAG -->|Misconceptions & Calibration| TUTOR
    TUTOR -->|Scaffolded Strategy Response| UI
```

---

## The 4 Autonomous Agents Explained

| Agent | Module | Description & Responsibilities |
|---|---|---|
| **Content Processing Agent** | `content_agent.py` | Chunks raw documents, extracts concept nodes via Pydantic schemas, performs fuzzy string merging (`NAME_MATCH_THRESHOLD = 0.85`), and sums exam frequencies. |
| **Orchestrator Agent** | `orchestrator.py` | Manages prerequisite gates (`MASTERY_GATE = 0.6`) and determines the **Next Best Action** (`remediate_prerequisite`, `run_diagnostic`, or `transfer_problem`). |
| **Diagnostic Agent** | `diagnostic_agent.py` | Analyzes student answers, confidence levels, and reasoning to identify root misconceptions and grade their severity (`high`, `medium`, `low`). |
| **Scaffolded Tutor Agent** | `tutor_agents.py` | Picks the optimal Socratic teaching intervention strategy (**Analogy**, **Guided Practice**, **Application**, **Challenge**) targeting the worst misconception. |

---

## Tech Stack

### **Frontend**
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** TailwindCSS v4 + Fontsource Inter
- **Animations & 3D:** GSAP + Framer Motion + Three.js / React Three Fiber
- **State & Router:** Zustand + React Router DOM 7 + React Hook Form + Zod

### **Backend & Infrastructure**
- **Runtime:** Bun / Node.js 22
- **Server Framework:** Express 5 + TypeScript
- **Database & ORM:** Prisma ORM + MySQL 8.4 / MongoDB / PostgreSQL
- **Caching & Queues:** Redis 7 + RabbitMQ + Apache Kafka
- **Reverse Proxy:** NGINX

### **AI & Agent Service**
- **Framework:** Python 3.11+ + FastAPI + Uvicorn
- **LLM Engine:** Ollama / Gemma Cloud (`gemma4:31b-cloud` / `gemma2`)
- **Data Validation:** Pydantic v2 Schema Enforcement

---

## Repository Directory Structure

```text
Agentic Mentor/
├── Frontend/                 # React 19 + Vite frontend web application
│   ├── src/
│   │   ├── components/       # UI components, forms & navbar
│   │   ├── pages/            # Home, Login, Register, Dashboard, Profile
│   │   ├── store/            # Zustand global state management
│   │   └── routes/           # Protected and admin routing
│   └── package.json
│
├── backend/                  # Node.js Express Gateway & Python AI Service
│   ├── AI_Mentor/            # Python FastAPI Agent Engine
│   │   ├── agents/           # Content, Orchestrator, Diagnostic & Tutor agents
│   │   ├── core/             # Gemma LLM client & text chunking utilities
│   │   ├── prompts/          # Structured prompt templates
│   │   ├── schemas/          # Pydantic state, content & diagnostic schemas
│   │   ├── app.py            # FastAPI endpoints
│   │   └── requirements.txt  # Python agent dependencies
│   ├── src/                  # Express Gateway (Server, Auth, Controllers, Prisma)
│   ├── prisma/               # Database schema & migrations
│   ├── docker-compose.yml    # Infrastructure services (MySQL, Redis, Kafka, RabbitMQ)
│   └── package.json
│
├── dockerfile                # Production Node/Express Docker container
└── README.md                 # Project Documentation
```

---

## Setup & Execution Guide

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js (v22+)](https://nodejs.org/) or [Bun](https://bun.sh/)
- [Python (v3.11+)](https://www.python.org/)
- [Ollama](https://ollama.com/) (with `gemma2` or `gemma4:31b-cloud` pulled)
- [Docker Desktop](https://www.docker.com/) (optional, for DB & queues)

---

### 1. Environment Configuration

#### Backend `.env` (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://appuser:apppassword@localhost:3307/appdb"
JWT_SECRET=your_super_secret_jwt_key
AI_MENTOR_SERVICE_URL=http://localhost:8000
LLM_MODEL=gemma4:31b-cloud
```

#### Frontend `.env` (`Frontend/.env`)
Create a `.env` file inside the `Frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

### 2. Starting Infrastructure Services (Optional Docker Setup)

To spin up MySQL, Redis, RabbitMQ, Kafka, and NGINX:
```bash
cd backend
docker-compose up -d
```

Run Prisma database migrations:
```bash
cd backend
npx prisma migrate dev --name init
```

---

### 3. Running the Python AI Mentor Service (FastAPI)

```bash
# 1. Navigate to AI Mentor directory
cd backend/AI_Mentor

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install Python dependencies
pip install fastapi uvicorn pydantic ollama

# 4. Start the FastAPI server (Runs on port 8000)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

### 4. Running the Backend Gateway (Express / Bun)

```bash
cd backend

# Using Bun:
bun install
bun run dev

# Or using NPM:
npm install
npm run dev
```

*The Express backend server will start on `http://localhost:5000`.*

---

### 5. Running the Frontend Application (Vite / React)

```bash
cd Frontend

npm install
npm run dev
```

*The Vite dev server will start on `http://localhost:5173`.*

---

## API Endpoints Reference

### AI Mentor FastAPI Engine (`http://localhost:8000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check endpoint |
| `POST` | `/mentor` | Combined prompt endpoint (Diagnose + Teach + Next Action) |
| `POST` | `/api/content/process` | Extracts structured concept maps from uploaded material |
| `POST` | `/api/learning/next-action` | Evaluates prerequisite chains & decides next action |
| `POST` | `/api/learning/diagnose` | Runs single diagnostic turn + generates scaffolded tutoring |
| `GET` | `/api/student/{student_id}` | Returns current student state, mastery scores & misconception logs |

---

## Running Tests

To test the Python agents pipeline locally:

```bash
cd backend/AI_Mentor

# Run pipeline unit test
python test_pipeline.py

# Test API endpoints
python test_app_endpoints.py

# Test live agent interactions
python test_live_agents.py
```

---

## License & Contributing

Distributed under the **MIT License**. Contributions, pull requests, and feature suggestions are welcome!

- **Repo Link:** [https://github.com/Kollishion/MentourAi.git](https://github.com/Kollishion/MentourAi.git)
