# TEAM_CONTEXT.md

# 🚀 FirstCommit AI
### AI Developer Onboarding Assistant

---

# 🏆 Hackathon Information

**Hackathon:** United Hacks V7

**Duration:** 24 Hours

**Theme**
Build innovative software that solves a real-world problem.

**Goal**
Build a polished MVP that solves one painful developer problem extremely well.

---

# 🎯 Project Vision

## One-Line Pitch

FirstCommit AI helps developers understand any GitHub repository and make their first meaningful contribution in minutes instead of days.

---

## Problem Statement

Every developer has experienced this.

You join a company or discover an open-source project.

Someone says:

> "Here's the GitHub repository."

Now you spend hours trying to answer questions like:

- Where do I start?
- What does this project do?
- Which files matter?
- How is the project structured?
- Where is authentication?
- Where should I make my first contribution?

Large repositories can take hours or days to understand.

Many developers abandon open-source projects simply because onboarding is difficult.

Companies also lose engineering productivity because every new developer repeats the same onboarding process.

---

# 💡 Solution

Paste a GitHub repository URL.

FirstCommit AI automatically:

- Understands the repository
- Detects technologies
- Explains folders
- Generates a personalized onboarding roadmap
- Answers repository-specific questions using AI

Instead of reading hundreds of files...

Developers simply ask questions.

---

# 🎯 Core Value

We are NOT building:

❌ Another ChatGPT

❌ GitHub Copilot

❌ AI Code Generator

We ARE building:

✅ AI Developer Onboarding

---

# 📈 Success Metric

Reduce repository onboarding

From:

6+ hours

To:

30 minutes or less

---

# 👥 Target Users

Primary

- Junior Developers
- New Employees
- Open Source Contributors
- Students
- Hackathon Teams

Secondary

- Engineering Managers
- Startup Teams
- Companies onboarding developers

---

# 🏗 MVP Scope (DO NOT ADD MORE)

These are the ONLY required features.

---

## 1. Repository Analysis

Input

GitHub Repository URL

Example

https://github.com/vercel/next.js

Output

Repository analyzed.

---

## 2. AI Project Summary

Generate

- What this project does
- Main purpose
- Main technologies
- Architecture overview

---

## 3. Tech Stack Detection

Automatically detect

- React
- Next.js
- TypeScript
- FastAPI
- Django
- Express
- MongoDB
- PostgreSQL
- etc.

Display with icons.

---

## 4. Folder Explanation

Explain folders like

src/

components/

hooks/

utils/

lib/

api/

No code explanation.

Only purpose.

---

## 5. Personalized Onboarding Roadmap ⭐ MAIN FEATURE

User selects

- Frontend Developer
- Backend Developer
- Full Stack Developer
- Open Source Contributor

AI generates

Step-by-step learning path.

Example

Step 1

Read README

↓

Step 2

Understand project structure

↓

Step 3

Learn routing

↓

Step 4

Understand authentication

↓

Step 5

Make your first contribution

---

## 6. Ask Repo

Repository-specific AI chat.

Examples

Where is authentication?

How do I add a page?

Where are API routes?

What file should I read first?

Uses RAG.

---

# ❌ Out of Scope

DO NOT BUILD

- Authentication
- User Login
- Team Collaboration
- GitHub OAuth
- GitHub App
- VS Code Extension
- Slack Integration
- Pull Request Generation
- AI Code Editing
- Repository Upload
- Private Repository Support

If time remains,

THEN add stretch features.

---

# ⭐ Stretch Goals

Only after MVP is complete.

- Beginner Tasks
- Mermaid Architecture Diagram
- README Improvement
- Export PDF
- API Endpoint Detection

---

# 🧠 Technical Architecture

Frontend

Next.js

↓

Backend API

FastAPI

↓

Repository Parser

GitPython

↓

Important File Reader

↓

Gemini

↓

Embeddings

↓

ChromaDB

↓

Repository Chat

---

# 📂 Important Files to Read

Priority

README.md

package.json

requirements.txt

Dockerfile

docker-compose.yml

.env.example

next.config.js

vite.config.ts

main.py

app.py

server.js

tsconfig.json

Folder Structure

Do NOT analyze every file initially.

Only index deeper code for RAG.

---

# 🛠 Tech Stack

Frontend

- Next.js
- React
- TailwindCSS
- shadcn/ui

Backend

- FastAPI
- Python
- GitPython

AI

- Gemini 2.5 Flash

RAG

- ChromaDB


Version Control

- GitHub

---

# 🎨 UI Structure

Landing Page

↓

Analyze Repository

↓

Loading Animation

↓

Dashboard

Dashboard contains

- Project Summary
- Tech Stack
- Folder Explorer
- Onboarding Roadmap
- Ask Repo Chat

Simple.

Clean.

Modern.

---

# 👨‍💻 Team Members

## Samvit

Role

Team Lead

Backend Engineer

AI Engineer

Responsibilities

- Backend
- API Development
- Repository Cloning
- Repository Parsing
- AI Integration
- Gemini
- ChromaDB
- RAG
- Prompt Engineering
- API Design
- Integration
- GitHub Repository Management
- Devpost Submission
- Architecture Decisions
- Final Technical Q&A

Owns

Everything behind the scenes.

---

## Krishna

Role

Frontend Engineer

UI/UX Designer

Responsibilities

- Landing Page
- Dashboard
- Responsive UI
- Tailwind Components
- Folder Explorer UI
- Roadmap UI
- Chat UI
- Loading Animation
- UI Polish
- Documentation
- README Screenshots
- Presentation Slides
- Demo Flow

Owns

Everything users see.

---

# 🤝 Shared Responsibilities

Research

Both

Testing

Both

Presentation

Krishna

- Problem
- Demo
- Business Impact

Samvit

- Technical Architecture
- AI
- RAG
- Judge Questions

---

# 🌿 Git Workflow

Branches

main

backend

frontend

rag

ui-polish

Never push unfinished work directly to main.

Commit frequently.

---

# 📡 API Contract

POST

/analyze

Input

Repository URL

Output

- Summary
- Tech Stack
- Folder Explanation
- Roadmap

---

POST

/chat

Input

Repository ID

Question

Output

AI Answer

Referenced Files

---

# 📅 Development Timeline

## Phase 1

Backend setup

Frontend setup

Landing page

API skeleton

---

## Phase 2

Repository cloning

Summary generation

Tech stack detection

Dashboard

---

## Phase 3

Folder explanation

Roadmap generation

Integration

---

## Phase 4

Repository chat

Testing

Deployment

---

## Final Hours

NO NEW FEATURES.

Only

- Bug Fixes
- UI Polish
- Deployment
- README
- Demo Video
- Devpost
- Presentation

---

# 🏁 Mission Statement

**Our objective is not to build the biggest AI tool.**

**Our objective is to help every developer go from cloning a repository to making their first meaningful commit in minutes instead of days.**