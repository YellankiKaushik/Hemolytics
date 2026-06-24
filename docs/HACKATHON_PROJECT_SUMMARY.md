# Hemolytics — Hackathon Project Summary

## 1. Project Snapshot

| Item | Details |
| --- | --- |
| Project name | Hemolytics |
| Domain | Blood donation coordination, nonprofit operations, AI for Good |
| Event context | AI for Good / Blood Warriors hackathon context |
| Build type | Hackathon-ready working MVP |
| Frontend stack | React, Vite, TypeScript, Tailwind CSS |
| Backend stack | Python Lambda handlers, API Gateway, DynamoDB, S3, Bedrock, CloudWatch |
| Cloud provider | AWS |
| Deployment status | Frontend deployed on AWS Amplify; backend deployed through AWS SAM/API Gateway |
| GitHub repository | https://github.com/YellankiKaushik/Hemolytics |
| Live frontend | https://main.d2sj4v5ffjc9ah.amplifyapp.com |
| Backend API | https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod |
| MVP status | Complete as a hackathon MVP; not a production-certified healthcare system |

## 2. Executive Summary

Hemolytics is a hackathon-ready AI for Good MVP built for blood donation coordination in the Blood Warriors context. It helps coordinators move from donor/request data to a practical workflow: load the dataset, understand the donor network, prioritize potential donor contacts, draft safe outreach, classify donor replies, escalate when needed, and generate anonymized awareness content.

The project is a working cloud-deployed MVP, not only a static UI. The frontend is built with React, Vite, TypeScript, and Tailwind CSS. The backend is an AWS serverless system using API Gateway, Lambda, DynamoDB, S3, Bedrock, and CloudWatch. The project is documented for GitHub readers, judges, future contributors, and later content reuse.

Hemolytics is not a production-certified healthcare or blood-bank system. It supports coordinator decision-making; it does not certify donor health, donor eligibility, blood safety, completed donations, or medical outcomes.

## 3. Hackathon Context

Hemolytics was built in the AI for Good / Blood Warriors context, where the central challenge is practical blood donation coordination. The goal was to create something that demonstrates real operational value within a constrained hackathon timeline: dataset ingestion, AWS deployment, backend APIs, AI-assisted workflows, and a frontend that judges can use end-to-end.

The project focuses on coordinator support rather than replacing medical or human decision-making. It demonstrates how a nonprofit-style blood coordination workflow could be improved with structured data, matching logic, safe AI writing assistance, and cloud infrastructure.

Hemolytics is complete as a hackathon MVP. The remaining work belongs to production expansion: security, role-based workflows, consent, communication integrations, optimized data access, auditability, and compliance review.

No judging outcomes, awards, real-world adoption, or verified medical outcomes are claimed in this summary.

## 4. Problem We Tried to Solve

Blood donation coordination is time-sensitive and operationally messy. Coordinators often need to work across donor lists, request details, status updates, reply messages, and awareness communication while avoiding unsafe claims.

The core problems Hemolytics addresses at MVP level are:

- Donor and request data can be fragmented across rows, contacts, and activity history.
- Coordinators need fast donor shortlisting when a request appears.
- Donor availability remains uncertain until the donor is contacted.
- Response follow-up is time-sensitive, especially when a donor declines or does not reply.
- Outreach must be safe, respectful, and human-verifiable.
- Impact storytelling must avoid patient PII, fake lives-saved claims, and medical outcome claims.
- Dataset quality issues such as duplicate users, unknown blood groups, and missing locations can slow coordination.

The MVP frames these as coordination-support problems, not medical automation problems.

## 5. Proposed Solution

Hemolytics proposes a coordinator-support workflow:

```text
Dataset Ingestion
    -> Dashboard Intelligence
    -> SmartMatch Donor Ranking
    -> AI Outreach
    -> Response Tracking
    -> Escalation / Action Suggestion
    -> Impact Story
    -> Estimated Impact Snapshot
```

The system helps a coordinator answer practical questions:

- Is the dataset loaded and usable?
- How many donor/user records are organized?
- Where are the data quality gaps?
- Which donors should be reviewed first for a request?
- What safe message can a coordinator send?
- How should a donor reply be interpreted?
- Should the workflow escalate to the next donor?
- How can awareness content be generated without exposing PII or overclaiming outcomes?

The solution is intentionally bounded. It assists the workflow, but it keeps verification, final decisions, donor eligibility, logistics, and medical safety with authorized humans.

## 6. What We Actually Built

### Landing Page

What it does: introduces Hemolytics, explains the workflow, shows AWS-connected architecture, presents a safety principle, and includes an Estimated Impact Snapshot.

Why it matters: first-time users and judges can understand the project before entering the dashboard.

Demo contribution: frames the product story and gives clear entry points into Dashboard, SmartMatch, and Outreach.

Safety boundary: describes AI as coordination assistance only, not medical certification.

### Dataset Ingestion

What it does: provides a primary action to load or reload `Dataset.csv` from S3 into DynamoDB through the existing `/load-dataset` backend API.

Why it matters: the demo begins with real backend data movement rather than static numbers.

Demo contribution: shows rows loaded, cleaned rows, unique users created, duplicate groups handled, donor records written, request records written, invalid blood groups flagged, and missing locations flagged.

Safety boundary: the page makes clear that browser CSV upload to S3 is not implemented; the button reloads the S3 dataset into DynamoDB.

### Dashboard

What it does: reads sampled donor/request metrics from DynamoDB and presents donor network, dataset quality, active requests, and re-engagement indicators.

Why it matters: coordinators need a quick operational view before matching and outreach.

Demo contribution: demonstrates AWS-connected analytics with `dashboardMode: "sampled"` for demo-speed reliability.

Safety boundary: metrics are coordination indicators, not verified medical outcomes.

### SmartMatch

What it does: ranks potential donors for a request using donor data, blood group, location, eligibility/status indicators, engagement, and donation history fields.

Why it matters: coordinators need a shortlist of donors to review first.

Demo contribution: shows top ranked donor candidates, confidence labels, reason-for-ranking text, and recommended coordinator action.

Safety boundary: SmartMatch prioritizes donor contacts for coordinator review; it does not guarantee availability, donor eligibility, or blood safety.

### AI Outreach

What it does: generates coordinator-ready outreach copy through AWS Bedrock with safe fallback behavior.

Why it matters: coordinators need fast, respectful, safe message drafts.

Demo contribution: shows Bedrock/fallback metadata, generated message text, copy behavior, and "Mark as Sent" style workflow support.

Safety boundary: this is WhatsApp-style copy only. It does not automatically send WhatsApp messages and does not replace coordinator judgment.

### Response Tracking

What it does: classifies donor replies into `confirm`, `decline`, `reschedule`, or `no_response`, then returns a status, summary, next action, escalation flag, and next donor ID where applicable.

Why it matters: coordinators need visible follow-up and escalation logic after outreach.

Demo contribution: "Yes, I am available" visibly becomes a confirm/donor-confirmed result; "Sorry, I cannot donate today" can trigger escalation behavior.

Safety boundary: classification supports follow-up; it does not medically approve donors.

### Impact Story

What it does: generates safe anonymized awareness content, social post copy, and coordinator summary through Bedrock or fallback behavior.

Why it matters: nonprofit coordination often needs responsible awareness messaging.

Demo contribution: turns coordination metrics into safe narrative content without patient PII.

Safety boundary: no lives-saved claims, no guaranteed outcomes, no patient PII, and no medical certification claims.

### API Settings

What it does: shows AWS Connected Mode, API URL visibility, endpoint list, table names, and safety notes.

Why it matters: judges and developers can verify that the frontend is connected to the backend instead of only running mock data.

Demo contribution: makes the deployed architecture transparent.

Safety boundary: documents the backend as an assistive system with human verification.

### Estimated Impact Snapshot

What it does: displays safe coordination-support metrics such as records processed, unique records organized, request records identified, data quality flags, and donor profiles prioritized.

Why it matters: it gives judges a fast sense of potential operational impact without making medical outcome claims.

Demo contribution: appears on Landing, Dashboard, and Impact Story pages.

Safety boundary: metrics are estimated coordination indicators, not confirmed medical outcomes.

### Responsive Layout

What it does: provides a desktop app shell with stable sidebar layout and mobile-friendly drawer/navigation.

Why it matters: the live app is feasible to demo on desktop and mobile.

Demo contribution: improves presentation quality and confidence during judging.

### AWS Backend

What it does: exposes seven API Gateway routes backed by Lambda handlers and service modules.

Why it matters: proves the MVP is deployed with real cloud infrastructure and not only frontend mock logic.

Demo contribution: supports health, dashboard, dataset loading, matching, outreach, response tracking, and impact story generation.

### GitHub Documentation

What it does: documents the technical system, architecture, API, backend, frontend, database, setup/deployment, future roadmap, and hackathon summary.

Why it matters: the repository can be reviewed, explained, reused for articles/PPT, and extended later.

Demo contribution: gives judges and future readers a clear path through what was built and what is future work.

## 7. Live Demo Flow

1. Open the Landing page.
2. Show the Hemolytics workflow and Estimated Impact Snapshot.
3. Go to Dataset Ingestion.
4. Click or describe "Load / Reload Dataset from S3" and show dataset processing metrics.
5. Go to Dashboard.
6. Explain donor/request intelligence, sampled dashboard mode, data quality, active donors, and re-engagement indicators.
7. Go to SmartMatch.
8. Enter or use a request and rank donors for coordinator review.
9. Go to AI Outreach.
10. Generate coordinator-ready outreach copy and point out that it does not send WhatsApp automatically.
11. Go to Response Tracking.
12. Classify a donor reply such as "Yes, I am available" or "Sorry, I cannot donate today" and show next action/escalation.
13. Go to Impact Story.
14. Generate anonymized awareness copy and coordinator summary.
15. Go to API Settings.
16. Show AWS Connected Mode, live API URL, implemented endpoints, DynamoDB tables, and safety configuration.

This flow is suitable for a live demo, PPT walkthrough, future article explanation, or portfolio case study.

## 8. Dataset and Data Processing Summary

The dataset source is `Dataset.csv` stored in S3. It is not committed to the repository. The frontend Dataset Ingestion page calls `loadDataset()` in `src/services/api.ts`, which sends `POST /load-dataset` when AWS Connected Mode is enabled.

The backend flow is:

```text
S3 Dataset.csv
    -> LoadDatasetFunction
    -> backend/handlers/load_dataset.py
    -> backend/services/dataset_service.py
    -> cleaning and normalization
    -> donor deduplication
    -> request record generation
    -> backend/services/dynamodb_service.py
    -> HemolyticsDonors and HemolyticsRequests
```

The ingestion service handles:

- CSV reading from S3.
- Blood group normalization.
- coordinate validation.
- date parsing.
- numeric field conversion.
- donor scoring field derivation.
- duplicate `user_id` handling.
- request ID generation.
- DynamoDB batch write safety.

Known dataset load metrics:

| Metric | Value |
| --- | ---: |
| Rows loaded | 7,033 |
| Unique users created | 6,946 |
| Duplicate groups handled | 87 |
| Invalid/unknown blood groups flagged | 2,036 |
| Missing locations flagged | 24 |
| Donor records written | 6,946 |
| Request records written | 786 |

No raw dataset contents are included in this summary.

## 9. System Architecture Summary

Hemolytics uses a serverless AWS architecture:

```text
User Browser
    |
    v
AWS Amplify hosted React/Vite/Tailwind frontend
    |
    v
src/services/api.ts
    |
    v
Amazon API Gateway
    |
    v
AWS Lambda handlers
    |
    v
Backend service layer
    |
    +--> Amazon DynamoDB
    +--> Amazon S3
    +--> AWS Bedrock Runtime
    +--> Amazon CloudWatch Logs
```

The frontend is deployed separately through Amplify. The backend is deployed separately through AWS SAM/CloudFormation. This separation keeps Amplify responsible for static frontend hosting and SAM responsible for API Gateway, Lambda, DynamoDB, S3, IAM, Bedrock access, and outputs.

For the deeper architecture reference, see `docs/ARCHITECTURE.md`.

## 10. Technical Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Lucide React icons
- AWS Amplify Hosting

Backend:

- Python 3.11 Lambda handlers
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- AWS Bedrock Runtime
- Amazon CloudWatch
- AWS SAM / CloudFormation
- `boto3` for AWS service access

Repository/documentation:

- GitHub
- Markdown documentation in `docs/`
- `amplify.yml` for frontend hosting build configuration
- `backend/template.yaml` for serverless infrastructure

## 11. Backend APIs Built

| Method | Endpoint | Frontend page | Workflow role |
| --- | --- | --- | --- |
| `GET` | `/health` | API Settings / diagnostics | Confirms backend health and architecture metadata |
| `GET` | `/dashboard` | Dashboard | Returns sampled donor/request analytics from DynamoDB |
| `POST` | `/load-dataset` | Dataset Ingestion | Loads S3 dataset into DynamoDB after cleaning/deduplication |
| `POST` | `/match` | SmartMatch | Ranks top donor candidates for coordinator review |
| `POST` | `/chat` | AI Outreach | Generates safe coordinator-ready outreach copy through Bedrock/fallback |
| `POST` | `/response` | Response Tracking | Classifies donor reply and returns follow-up/escalation state |
| `POST` | `/impact-story` | Impact Story | Generates anonymized awareness and coordinator summary content |

For full endpoint contracts, see `docs/API_DOCUMENTATION.md`.

## 12. SmartMatch Summary

SmartMatch uses donor records from DynamoDB to rank potential contacts for a blood request. The implemented scoring logic lives in `backend/services/scoring_service.py`.

At MVP level, SmartMatch uses:

- exact blood group matching
- request latitude/longitude
- donor latitude/longitude
- haversine distance
- eligibility status indicators
- active/inactive donor status
- donation history
- engagement score
- location quality score

The result is a ranked shortlist of up to five donor candidates. Output fields include rank, donor ID, blood group, distance, score, confidence label, reason for ranking, and recommended coordinator action.

Safety statement: SmartMatch ranks donors to contact first. It does not guarantee donor availability, donor eligibility, donor health, donation completion, or blood safety.

## 13. AI Outreach Summary

AI Outreach generates coordinator-ready message drafts. The backend path is:

```text
src/pages/AiOutreach.tsx
    -> generateOutreachMessage()
    -> POST /chat
    -> backend/handlers/chat.py
    -> backend/services/bedrock_service.py
    -> AWS Bedrock Runtime or safe fallback
    -> HemolyticsConversations
```

The current MVP supports WhatsApp-style copy as a tone/style, but it does not integrate with the production WhatsApp Business API and does not automatically send messages.

The Bedrock integration uses AWS Bedrock Runtime through `boto3`. If Bedrock fails because of account/model access, IAM, region, or runtime issues, the backend returns safe fallback output instead of breaking the flow.

Safety statement: AI Outreach assists message drafting. It does not send messages automatically, does not certify donor health, and does not replace coordinator judgment.

## 14. Response Tracking Summary

Response Tracking helps coordinators interpret donor replies and decide the next workflow action.

Implemented intent categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

The backend stores the response analysis in `HemolyticsResponses` and attempts to update the related request status in `HemolyticsRequests` when a request ID is available. The frontend shows a Latest AI Response Analysis panel so that a tested reply visibly changes the screen.

Example flow:

- "Yes, I am available" -> `confirm` -> `donor_confirmed`
- "Sorry, I cannot donate today" -> `decline` -> escalation path
- "Tomorrow evening works" -> `reschedule` -> follow-up path
- empty/timeout -> `no_response` -> escalation path

Safety statement: Response Tracking assists follow-up. It does not approve donors medically or confirm completed donations.

## 15. Impact Story and Estimated Impact Summary

Impact Story generates anonymized awareness messaging and coordinator summaries. It is intended for responsible storytelling, not medical outcome reporting.

The output shape includes:

- `awarenessMessage`
- `socialPost`
- `coordinatorSummary`
- `safetyNotice`
- `bedrock_available`
- `fallback_used`

Estimated Impact Snapshot appears across the frontend and frames metrics as coordination-support indicators. It includes values such as records processed, unique user records organized, request records identified, data quality flags, and donor profiles prioritized for coordinator review.

Safe claims:

- records organized
- requests identified
- donors prioritized for coordinator review
- responses classified
- outreach made easier
- potential coordination impact

Unsafe claims intentionally avoided:

- people were saved
- donations were completed
- donors were medically approved
- blood was certified safe
- patient outcomes were guaranteed

## 16. Safety and Ethical Boundaries

Hemolytics does not:

- certify donor health
- certify donor eligibility
- certify blood safety
- guarantee donor availability
- replace coordinators
- replace authorized medical staff
- claim completed donations
- claim people were saved
- expose patient PII in impact content

Hemolytics does:

- organize donor/request data
- prioritize possible donor contacts
- assist outreach drafting
- classify donor replies
- suggest follow-up actions
- support anonymized awareness messaging
- provide estimated coordination indicators

This boundary is central to the project. Hemolytics is built to help coordinators move faster and communicate more safely, while keeping final eligibility, logistics, blood safety, and medical decisions with authorized humans.

## 17. Key Engineering Decisions

- Serverless AWS architecture: API Gateway, Lambda, DynamoDB, S3, Bedrock, and CloudWatch made the MVP deployable without managing servers.
- React/Vite/Tailwind frontend: fast iteration, clean UI structure, and Amplify-ready static output.
- DynamoDB for MVP storage: simple on-demand tables aligned with the serverless architecture.
- S3 for dataset source: keeps `Dataset.csv` outside GitHub and supports reload through Lambda.
- Lambda handlers plus service layer: keeps route handling separate from DynamoDB, dataset, scoring, Bedrock, and response logic.
- Bedrock with safe fallback: preserves demo reliability when model access is restricted or unavailable.
- Sampled dashboard analytics: avoids timeout risk on real dataset size while keeping dashboard responsive.
- Human verification wording: prevents unsafe medical or outcome claims.
- Documentation-first repo polish: makes the project easier to review, present, and extend after the hackathon.

## 18. Main Challenges Solved

| Challenge | Solution |
| --- | --- |
| Duplicate `user_id` values caused DynamoDB batch-write risk | Donor profiles are deduplicated by `user_id`, request IDs are generated uniquely, and `batch_write_items()` includes a duplicate-key safety guard |
| Dataset quality issues | Ingestion flags invalid/unknown blood groups, missing locations, incomplete rows, and duplicate groups |
| Dashboard timeout risk | Dashboard uses limited scans, projection expressions, and sampled analytics |
| Frontend production styling/deployment | Vite/Tailwind/Amplify configuration was hardened so production CSS and build output render correctly |
| Mobile and desktop layout issues | Responsive app shell, mobile drawer behavior, and stable desktop sidebar were refined |
| Bedrock model/account access variance | Bedrock errors are safely logged and user-facing flows return fallback content when needed |
| Unsafe impact wording risk | Impact Story and Impact Snapshot use coordination-support language instead of lives-saved or medical outcome claims |
| Repository hygiene | `.gitignore`, docs, env examples, and deployment notes keep secrets, datasets, and build artifacts out of commits |

These are described at a high level here. Deeper technical details live in the technical, backend, database, and API documentation files.

## 19. Final MVP Completion Status

| Area | Status |
| --- | --- |
| Frontend | Completed |
| Backend | Completed |
| AWS deployment | Completed |
| Dataset ingestion | Completed |
| SmartMatch | Completed |
| AI Outreach | Completed with Bedrock/fallback behavior |
| Response Tracking | Completed |
| Impact Story | Completed with Bedrock/fallback behavior |
| Estimated Impact Snapshot | Completed |
| Responsive layout | Completed |
| API Settings / AWS visibility | Completed |
| GitHub documentation | Completed and expanded |
| Production roadmap | Documented in `docs/FUTURE_ENHANCEMENTS.md` |

Hemolytics is complete as a hackathon MVP.

## 20. What Is Not Yet Production-Grade

The following are future production needs, not hackathon failures:

- no production authentication/RBAC
- no WhatsApp Business API sending
- no donor-side mobile app
- no full request lifecycle management
- no donor availability calendar
- no optimized geospatial/GSI-based matching
- no full audit approval workflow
- no production compliance certification
- no verified medical outcome tracking
- no communication consent system
- no delivery/read receipt tracking
- no background queue or Step Functions workflow

For a detailed roadmap, see `docs/FUTURE_ENHANCEMENTS.md`.

## 21. Future Enhancements Summary

Future production work could expand Hemolytics into a deeper coordinator operating layer:

- coordinator assignment and request lifecycle workflows
- donor availability and cooldown tracking
- WhatsApp/SMS/email notification integrations
- DynamoDB GSIs and geospatial indexing
- audit logs and approval workflows
- role-based access control
- consent-aware outreach
- campaign/community awareness layer
- analytics and impact intelligence
- CloudWatch alarms and operational dashboards
- privacy, security, and compliance review

These are future enhancements. The current MVP already demonstrates the core workflow.

## 22. How This Summary Can Be Reused

This document can serve as a base for:

- Medium article
- Dev.to article
- LinkedIn launch post
- PPT walkthrough
- Gemini image prompts
- NotebookLM summaries
- portfolio case study
- demo script
- GitHub project explanation

It intentionally avoids writing those outputs directly. Instead, it provides the grounded project story, workflow, constraints, technical decisions, safety boundaries, and production roadmap context needed to create them later.

## 23. Ready-to-Copy Short Summary

Hemolytics is an AWS-deployed AI for Good hackathon MVP for blood donation coordination. It ingests donor/request data from S3 into DynamoDB, surfaces dashboard intelligence, ranks potential donor contacts through SmartMatch, generates safe coordinator-ready outreach copy, classifies donor replies, and creates anonymized impact/awareness content. The system is built with React, Vite, Tailwind CSS, API Gateway, Lambda, DynamoDB, S3, Bedrock, CloudWatch, and AWS Amplify. It is designed for coordinator decision support, not medical certification.

## 24. Final Reflection

Hemolytics demonstrates how a focused hackathon build can turn a complex coordination problem into a working cloud-deployed MVP. The project connects data ingestion, operational visibility, donor prioritization, safe AI-assisted communication, response tracking, escalation support, and responsible awareness messaging into one coherent workflow.

The project is complete as a hackathon submission. The next chapter is production expansion: stronger security, role-based workflows, consent-aware communication, optimized matching, auditability, monitoring, and real-world integrations. The core principle should remain unchanged: Hemolytics assists coordination, while final donor eligibility, medical decisions, blood safety, and verified outcomes remain human-led.
