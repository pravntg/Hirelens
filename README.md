# HireLens ATS • Smart AI Resume Screener 🚀

An enterprise-grade, production-ready **AI-Powered Smart Resume Screener** and modern **ATS Candidate Dashboard**. The system ingests resumes (PDF files) alongside target Job Descriptions (JD), extracts structured candidate data (skills, experience, education), performs semantic LLM evaluation across 4 dimensions, computes a fit score (1-10 / 0-100), determines strict multi-criteria shortlist status, and presents shortlisted candidates in a Crimson Samurai Dark Cyber UI dashboard.

---

## 🔗 Live Links & Deliverables

- **Live Production App**: **[https://resumind-lake-two.vercel.app](https://resumind-lake-two.vercel.app)**
- **GitHub Repository**: **[https://github.com/pravntg/resumind.git](https://github.com/pravntg/resumind.git)**
- **MongoDB Atlas Cluster**: `smart_resume` database (`candidates` collection)

---

## 🏗️ Technical Stack & Architecture

```
[ Candidate Resumes (PDF ONLY) + Target Job Description (PDF/Text) ]
                       │
                       ▼
           ┌──────────────────────┐
           │ React + Tailwind UI  │ (Vite + TypeScript + Crimson Samurai Theme)
           └──────────┬───────────┘
                      │ REST API / Multipart Form-Data
                      ▼
           ┌──────────────────────┐
           │  Express.js Backend  │ (TypeScript + Multer + Zod + pdf-parse)
           └──────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐          ┌───────────────────┐
│ pdf-parse /   │          │ Live LLM Engine   │ (Groq Cloud Qwen-3.6-27B &
│ text extract  │          │  Screening Engine │  Google Gemini 1.5 Flash)
└───────┬───────┘          └─────────┬─────────┘
        │                            │
        └─────────────┬──────────────┘
                      ▼
           ┌──────────────────────┐
           │ MongoDB Atlas DB     │ (Document storage for candidate profiles,
           │ (smart_resume)       │  scores, breakdowns & recruiter notes)
           └──────────────────────┘
```

- **Backend API**: Node.js + Express (TypeScript), `multer` (file upload), `pdf-parse` (PDF extraction), `zod` (runtime schema validation), `mongoose` (MongoDB Atlas ODM).
- **LLM Engine**: Dual live AI provider support:
  - **Groq Cloud AI**: `qwen/qwen3.6-27b` (Deep Reasoning LLM with JSON completion retry fallback).
  - **Google Gemini AI**: `gemini-1.5-flash` (High-speed multi-modal LLM).
- **Frontend Dashboard**: React 18 + Vite (TypeScript), Tailwind CSS, Lucide React icons, Crimson Samurai Dark Cyber design system (`#0A0A0E` obsidian canvas, `#FF1744` crimson glows).

---

## ✨ Core Features & Scope Compliance

1. **Strict PDF Upload Validation**: PDF input requirement (`.pdf` ONLY). Non-PDF files (`.docx`, `.txt`) trigger instant upload error feedback.
2. **Document Type & Purpose Classifier**:
   - **Academic Lab Sheets & Question Papers**: Automatically flagged as `Invalid Document Type` (`overall_score = 1`).
   - **Course Certificates & Badges**: Flagged as `Invalid Document Type` (`overall_score = 1`).
   - **Job Description Specification Files**: Flagged as `Invalid Document Type` (`overall_score = 1`).
   - **Valid Resumes**: Extracted and evaluated dynamically against job requirements.
3. **Structured Data Extraction**:
   - Extracts Candidate Name, Contact Email & Phone, LinkedIn/GitHub links, Total Experience Years, Current Role & Company, Technical & Soft Skills list, Education Degree & Institution, Certifications.
4. **Semantic LLM Screening Engine**:
   - Evaluates 4 dimensions (0-100 each): **Skills Match**, **Experience Match**, **Education & Certifications**, **Tone & ATS Relevance**.
   - Computes **Overall Fit Score** (1-10 integer scale & 0-100 percentage scale).
   - **Strict Multi-Criteria Shortlisting**: Candidates are shortlisted (`shortlisted = true`) IF AND ONLY IF:
     - `is_valid_resume` === true
     - `overall_score` $\ge 7/10$
     - `skills_score` $\ge 65\%$
     - `experience_score` $\ge 60\%$
     - `missing_requirements` $\le 3$
5. **Modern ATS Dashboard**:
   - **Analytics Bar**: Total candidates, shortlisted count, shortlist rate %, average fit score.
   - **Candidate Directory**: Searchable by candidate name, skill, or role; filterable by shortlist status (`Shortlisted` vs `Under Review`) and score slider.
   - **Split-Screen Modal**: View raw extracted resume text side-by-side with structured AI recommendations, strengths checklist, and recruiter action items.
   - **Detailed Rejection Audit**: Explains exact reasons when non-resume files are uploaded.

---

## 🎯 LLM System Prompt & Schema

### System Prompt (`screening.prompt.ts`)
```text
You are an expert ATS (Applicant Tracking System) and Technical Recruiter. Extract structured candidate profile data from the provided resume text and semantically evaluate the candidate against the target Job Description (JD).

### CRITICAL DOCUMENT VALIDATION RULE
FIRST: Check if the provided text is an ACTUAL INDIVIDUAL CANDIDATE RESUME / CV.
If the text is NOT an individual candidate resume (for example: Course Certificate of Completion, Academic Lab Sheet, Question Paper, Job Description Specification, or Presentation Deck):
- Set "is_valid_resume": false
- Set "invalid_resume_reason": "Uploaded document is not an individual candidate resume/CV."
- Set "overall_score": 1
- Set "shortlisted": false

### STRICT CRITERIA-BASED SHORTLISTING RULES
A candidate MUST ONLY BE SHORTLISTED ("shortlisted": true) IF AND ONLY IF ALL 4 OF THE FOLLOWING CRITERIA ARE MET:
1. "is_valid_resume" is true (must be a real candidate resume/CV).
2. "overall_score" >= 7 (out of 10).
3. "skills_score" >= 65 (out of 100).
4. "experience_score" >= 60 (out of 100).

Return ONLY valid JSON.
```

### Enforced Output JSON Schema
```json
{
  "is_valid_resume": true,
  "invalid_resume_reason": null,
  "candidate_profile": {
    "name": "Candidate Full Name",
    "contact": { "email": "email@example.com", "phone": "+1234567890", "location": "City, Country" },
    "total_years_experience": 4,
    "current_or_latest_role": "Full Stack Engineer",
    "current_or_latest_company": "Tech Corp",
    "education": [
      { "degree": "B.Tech Computer Science", "institution": "University Name", "year": "2022" }
    ],
    "skills": {
      "technical": ["React", "Node.js", "TypeScript", "MongoDB"],
      "soft": ["Problem Solving", "Communication"]
    },
    "certifications": ["AWS Certified Developer"]
  },
  "evaluation": {
    "overall_score": 9,
    "shortlisted": true,
    "breakdown": {
      "skills_score": 90,
      "experience_score": 85,
      "education_score": 85,
      "tone_and_relevance_score": 90
    },
    "justification": "Candidate possesses 4 years of full stack experience matching required stack.",
    "ai_summary": "1-2 sentence candidate summary overview",
    "strengths": ["Strong technical skills match", "Relevant work history"],
    "missing_requirements": [],
    "recruiter_notes": ["Fast-track to technical phone screen."]
  }
}
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/screen` | Accepts multipart form data (`resume` PDF file + `job_description`), runs LLM analysis, saves document to MongoDB Atlas (`smart_resume`), returns analysis. |
| `GET` | `/api/candidates` | Returns candidate list. Query params: `status` (`shortlisted` / `under_review`), `minScore` (1-10), `search` string. |
| `GET` | `/api/candidates/:id` | Returns deep-dive candidate document by ID. |
| `DELETE` | `/api/candidates/:id` | Deletes a candidate record from MongoDB. |
| `GET` | `/api/health` | System health check and MongoDB connection status. |

---

## 🚀 Installation & Local Run

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Install Dependencies
Run from the root directory:
```bash
npm run setup
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster0.nadsz43.mongodb.net/smart_resume?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Run Development Servers
From the root directory:
```bash
# Start Backend API (Port 5000)
npm run dev:backend

# Start Frontend Dashboard (Port 3000)
npm run dev:frontend
```

Open **http://localhost:3000** in your browser!

---

## 🎯 Evaluation Criteria Checklist & Focus

- ✅ **Code Quality & Structure**: Clean modular TypeScript codebase, Controller-Service-Model backend layout, Zod runtime schema validation with `.transform()` safety fallbacks, React functional components with custom hooks.
- ✅ **Data Extraction**: `pdf-parse` engine with text normalization, whitespace cleaning, and regex contact extraction heuristics.
- ✅ **LLM Prompt Quality**: Engineered system prompts with strict document type validation, multi-criteria shortlisting, and JSON mode completion retry fallbacks.
- ✅ **Output Clarity**: Crimson Samurai Dark Cyber UI dashboard with circular SVG match meters, category progress bars, shortlist pills, and detailed invalid document audit cards.
