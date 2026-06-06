# Hemolytics — AI-Powered Blood Donation Coordination Platform

## Project Status

- **Project Type**: React + TypeScript Modern Web Application
- **Entry Point**: `src/main.tsx`
- **Build System**: Vite
- **Styling System**: Tailwind CSS
- **Architecture**: Hackathon MVP — AWS-connected prototype

## Architecture

React + Vite + Tailwind → Amplify/S3 → API Gateway → Lambda → DynamoDB → Bedrock Claude 3 Haiku → S3 → CloudWatch

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Donor Intelligence Dashboard | Dataset metrics, blood group distribution, eligibility summary, re-engagement candidates, recent activity |
| `/dataset` | Dataset Ingestion | CSV upload, Blood Warriors dataset loading, cleaning summary, DynamoDB load summary, AWS data flow |
| `/smartmatch` | SmartMatch Donor Ranking | Request form with hard filters, top 5 ranked donors with match scores and confidence labels |
| `/outreach` | AI Outreach Message | Request/donor selection, tone/language picker, Priya AI persona, message generation with conversation memory |
| `/responses` | Response Tracking | Donor response board with AI intent detection, escalation rules, expandable detail rows |
| `/impact` | Impact Story | Safe awareness/motivation content generation with patient-safe anonymization rules |
| `/api-settings` | API Settings | Mode status, AWS architecture overview, API endpoints, DynamoDB tables, Bedrock model config |

## Source of Truth

- **Final Phase 1–12 execution document** controls the build.
- **AWS Infrastructure Changes** used only for Bedrock/AWS budget/no direct LLM API reminders.
- **Original Master Documentation** used only for idea, problem, personas, vision, pitch language, and UI inspiration.

## Key Tech

- React 18 + TypeScript + Vite + Tailwind CSS
- Zustand (state management)
- Lucide React (icons)
- DM Sans + Space Grotesk fonts

## Data

All data is mocked in `src/data/mockData.ts` — 12 donors, 5 blood requests, mock responses, and dashboard metrics. Uses fictional data with Indian cities and blood groups. No real donor or patient PII.

## Global Safety Banner

"Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with donor prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human/medical staff."

## Mode Switching

- **Mock Mode**: `VITE_API_BASE_URL` is empty → all features run client-side with mock data
- **AWS Connected Mode**: `VITE_API_BASE_URL` is set → calls real backend via API Gateway

## Important Constraints

- All AI routes through AWS Bedrock Claude 3 Haiku — no direct Anthropic or OpenAI API calls
- No PostgreSQL/RDS as primary data store
- No Redis as primary cache
- No production WhatsApp integration
- No direct Anthropic or OpenAI client libraries
- Frontend currently uses mock data; backend integration added later via Codex/Claude Code
