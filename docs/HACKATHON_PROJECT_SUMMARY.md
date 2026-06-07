# Hemolytics Hackathon Project Summary

## Project Name

Hemolytics

## One-Line Summary

AI-powered blood donation coordination platform for Blood Warriors and the AI for Good Hackathon.

## Problem

Blood donation coordination is time-sensitive and operationally complex. Coordinators need to understand donor readiness, identify relevant donors quickly, draft safe outreach, track responses, escalate when donors decline or do not respond, and communicate impact without exposing sensitive patient information.

## Solution

Hemolytics turns donor/request data into a coordinator workflow:

```text
Dataset -> Dashboard -> SmartMatch -> AI Outreach -> Response Tracking -> Impact Story
```

It is designed as a practical MVP rather than a full production community platform.

## Live Links

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

## Architecture

```text
React + Vite + Tailwind + Amplify
-> API Gateway
-> Lambda
-> DynamoDB
-> AWS Bedrock
-> S3
-> CloudWatch
```

## Core Features

Dataset ingestion:

- Reloads `Dataset.csv` from S3 into DynamoDB
- Cleans fields and derives scoring signals
- Deduplicates donor profiles
- Creates request records

Dashboard:

- Shows donor network readiness
- Shows dataset quality
- Shows active request pipeline
- Shows re-engagement candidates
- Uses sampled dashboard mode for demo-speed analytics

SmartMatch:

- Ranks top donors for coordinator review
- Uses blood group, eligibility, active status, valid location, proximity, engagement, experience, and location quality
- Avoids medical approval language

AI Outreach:

- Generates Priya-style coordinator-ready messages through AWS Bedrock
- Does not send WhatsApp automatically
- Falls back safely if Bedrock is unavailable

Response Tracking:

- Classifies donor replies as confirm, decline, reschedule, or no response
- Shows visible next action and escalation state
- Updates response and request records

Impact Story:

- Generates safe anonymized awareness content
- Produces awareness message, social post, and coordinator summary
- Avoids patient PII and medical outcome claims

API Settings:

- Shows AWS connected mode
- Lists endpoints, DynamoDB tables, model details, and safety notes

## Dataset Load Stats

Latest successful load:

- 7,033 rows loaded
- 6,946 unique users
- 786 request records
- 87 duplicate user groups handled
- 2,036 invalid/unknown blood groups flagged
- 24 missing locations flagged

## Technical Highlights

- Fully serverless AWS MVP
- DynamoDB-first backend
- S3 dataset reload flow
- Bedrock-only AI integration
- Safe fallback behavior for AI features
- Sampled dashboard aggregation to avoid live demo timeouts
- Mobile-friendly React app shell
- Clear safety boundary across frontend and backend

## Safety Statement

Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with prioritization, outreach, response understanding, escalation, and awareness messaging. Final decisions remain with authorized human coordinators and medical staff.

## What Is Intentionally Not Built

- Production WhatsApp Business API sending
- Full donor/community platform
- Role-based access control
- Patient notification system
- Medical eligibility certification
- Blood safety certification
- SageMaker training pipeline
- Direct OpenAI or Anthropic API integration

## Demo Script

1. Open the landing page.
2. Show AWS Connected Mode in API Settings.
3. Load or reload the dataset from S3.
4. Open Dashboard and explain sampled metrics.
5. Run SmartMatch for a blood request.
6. Generate AI Outreach copy.
7. Analyze a confirm response.
8. Analyze a decline response and show escalation.
9. Generate an Impact Story.
10. Reiterate safety principle: AI assists coordination only.

## Production Roadmap

- WhatsApp Business API integration
- Patient/coordinator notifications
- Donor mobile experience
- Emergency broadcast workflow
- Community awareness campaigns
- Role-based access and audit approvals
- DynamoDB GSI optimization
- Background jobs and escalation workflows
- CloudWatch alarms and operational dashboards

## Judging Fit

Hemolytics is built around a real coordination workflow, not only a chatbot or static dashboard. It combines dataset intelligence, serverless AWS infrastructure, Bedrock AI assistance, safety-aware copy generation, and coordinator-centered escalation.

