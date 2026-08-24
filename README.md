# Smart Resume Screener & ATS Dashboard 🚀

An enterprise-grade, production-ready **AI-Powered Smart Resume Screener** and modern **ATS Candidate Dashboard**. The system ingests resumes (PDF/DOCX/TXT) alongside target Job Descriptions (JD), extracts structured candidate data, performs semantic LLM evaluation across 4 dimensions, computes a fit score (1-10 / 0-100), determines shortlist status, and presents shortlisted candidates in a modern split-screen dashboard.

---

## 🏗️ Technical Stack & Architecture

```
[ Candidate Resumes (PDF/DOCX/TXT) + Target JD ]
                       │
                       ▼
           ┌──────────────────────┐
           │ React + Tailwind UI  │ (Vite + TypeScript + Lucide Icons)
           └──────────┬───────────┘
                      │ REST API / Multipart Form-Data
                      ▼
           ┌──────────────────────┐
           │  Express.js Backend  │ (TypeScript + Multer + Zod)
           └──────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐          ┌───────────────────┐
│  pdf-parse /  │          │   LLM Screening   │ (Google Gemini 2.5, OpenAI GPT-4o,
│ text extract  │          │  Semantic Engine  │  or Smart Offline Simulator)
└───────┬───────┘          └─────────┬─────────┘
        │                            │
        └─────────────┬──────────────┘
                      ▼
           ┌──────────────────────┐
           │ MongoDB (Mongoose)   │ (Document storage for candidate profiles,
           │ + Memory Fallback    │  scores, breakdowns & recruiter notes)
           └──────────────────────┘
```

- **Backend API**: Node.js + Express (TypeScript), `multer` (file handling), `pdf-parse` (PDF extraction), `zod` (runtime schema validation), `mongoose` (MongoDB ODM with automatic `mongodb-memory-server` zero-config fallback).
- **LLM Integration**: Multi-provider support (Google Gemini API `@google/genai` & OpenAI API `openai`), plus an intelligent offline Heuristic Engine for instant testing without API keys.
- **Frontend Dashboard**: React 18 + Vite (TypeScript), Tailwind CSS, Lucide React icons, SVG circular gauges.

---

## ✨ Core Features

1. **Multi-Format Ingestion**: Drag-and-drop dropzone for PDF, DOCX, and TXT resume files or raw text paste.
2. **Preset Target JDs**: Pre-configured target job templates (*Senior Full Stack Engineer*, *Lead AI/ML Engineer*, *Product Manager*).
3. **Semantic LLM Screening Engine**:
   - Evaluates 4 dimensions (0-100 each): **Skills Match**, **Experience Match**, **Education & Certifications**, **Tone & ATS Relevance**.
   - Calculates **Overall Match Rating** (1-10 integer scale).
   - Automated Shortlisting (`shortlisted = true` if Overall Score $\ge 7$).
   - Generates candidate profile, strengths (green checkmarks), missing requirements (amber alerts), and recruiter notes.
4. **Modern ATS Candidate Dashboard**:
   - **Summary Stats**: Total candidates, shortlisted count, shortlist rate %, average fit score.
   - **Candidate Directory**: Searchable by candidate name, skill, or role; filterable by shortlist status (`Shortlisted` vs `Under Review`) and min score slider.
   - **Split-Screen Deep Dive**: View raw resume text side-by-side with structured AI recommendations.

---

## 🎯 LLM Screening Prompt & Schema

### System Prompt
```text
You are an expert ATS (Applicant Tracking System) and Technical Recruiter. Your task is to extract candidate profile data from the provided resume text and semantically evaluate the candidate against the target Job Description (JD).

Evaluate across 4 core dimensions (scale of 0-100 for each):
1. Skills Match (0-100)
2. Experience Match (0-100)
3. Education & Certification Match (0-100)
4. Tone & ATS Relevance (0-100)

Compute an Overall Match Score (1-10 integer scale) and set "shortlisted" to true if Overall Score >= 7. Provide clear justifications, highlighted strengths, missing requirements, and recruiter notes.
```

### Enforced Output JSON Schema
```json
{
  "candidate_profile": {
    "name": "string",
    "contact": { "email": "string | null", "phone": "string | null" },
    "total_years_experience": "number | string",
    "education": [
      { "degree": "string", "institution": "string", "year": "string | null" }
    ],
    "skills": {
      "technical": ["string"],
      "soft": ["string"]
    }
  },
  "evaluation": {
    "overall_score": 8,
    "shortlisted": true,
    "breakdown": {
      "skills_score": 85,
      "experience_score": 80,
      "education_score": 90,
      "tone_and_relevance_score": 85
    },
    "justification": "string",
    "strengths": ["string"],
    "missing_requirements": ["string"],
    "recruiter_notes": ["string"]
  }
}
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/screen` | Accepts multipart form data (`resume` file + `job_description`), runs LLM analysis, saves document to MongoDB, returns analysis. |
| `GET` | `/api/candidates` | Returns candidate list. Query params: `status` (`shortlisted` / `under_review`), `minScore` (1-10), `search` string. |
| `GET` | `/api/candidates/:id` | Returns deep-dive candidate document by ID. |
| `DELETE` | `/api/candidates/:id` | Deletes a candidate record from MongoDB. |
| `GET` | `/api/jobs` | Returns saved Job Descriptions. |
| `POST` | `/api/jobs` | Saves a new target Job Description. |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install Dependencies
Run from the root directory:
```bash
npm run setup
```

### 2. Environment Configuration (Optional)
Copy `.env.example` in `backend/` to `.env`:
```bash
cp backend/.env.example backend/.env
```
*(If no API keys or MongoDB instance are supplied, the application automatically uses `mongodb-memory-server` and the Offline AI Simulator for instant zero-config testing).*

### 3. Run Development Servers
From the root directory:
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Start Frontend Dashboard (Port 3000)
npm run dev:frontend
```

Open **http://localhost:3000** in your browser!

---

## 📋 Evaluation Focus Summary

1. **Code Quality & Structure**: Clean modular TypeScript codebase, Controller-Service-Model backend layout, Zod runtime schema validation, React functional components with custom hooks.
2. **Data Extraction**: `pdf-parse` engine with text normalization, whitespace cleaning, and regex contact extraction heuristics.
3. **LLM Prompt Quality**: System prompt engineered with explicit criteria definitions, native JSON mode (`responseSchema` for Gemini, `json_object` for OpenAI), and multi-dimensional scoring rules.
4. **Output Clarity**: Modern ATS dashboard UI with circular SVG match meters, category progress bars, shortlist pills, and split-screen candidate review.
