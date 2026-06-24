# Hemolytics — Architecture Documentation

## 1. Architecture Overview

Hemolytics is a serverless AWS-based blood donation coordination MVP built for the AI for Good / Blood Warriors context. It connects a React frontend to an AWS backend that can load donor/request records, show dashboard intelligence, rank donor candidates, generate safe outreach copy, classify donor responses, and create anonymized awareness content.

The high-level runtime path is:

```text
React frontend on AWS Amplify
    -> Frontend API service layer
    -> Amazon API Gateway
    -> AWS Lambda handlers
    -> Backend service layer
    -> DynamoDB / S3 / Bedrock
    -> CloudWatch logs
```

The frontend is hosted as a static React + Vite + Tailwind application. The backend is deployed separately with AWS SAM and exposes API Gateway routes backed by Python Lambda handlers. DynamoDB stores donor, request, response, and conversation records. S3 stores the CSV dataset used for ingestion. AWS Bedrock supports AI Outreach and Impact Story generation with deterministic fallback behavior. CloudWatch captures Lambda execution logs and safe diagnostics.

This is a hackathon MVP architecture. It is designed for a real deployed demo and a practical future path, but it is not a full production-certified healthcare, blood bank, or medical operations system.

## 2. Architectural Goals

The architecture was shaped around these goals:

- Fast hackathon delivery with a complete end-to-end flow.
- Real deployed AWS backend instead of a frontend-only mock.
- Real dataset ingestion from S3 into DynamoDB.
- Coordinator-first workflow from data loading to donor review, outreach, response tracking, escalation, and awareness content.
- Safe AI-assisted communication through AWS Bedrock, not direct third-party model APIs.
- Low operational overhead through serverless AWS services.
- Clear separation between frontend pages, frontend API calls, Lambda handlers, backend services, and storage.
- Demo-speed performance on a real dataset through sampled analytics and limited scans.
- Safety-first output handling that avoids medical approval, blood safety certification, patient PII, and outcome overclaims.
- A scalable future direction without prematurely adding heavy production systems.

## 3. High-Level Architecture Diagram

```text
User / Judge / Coordinator
    |
    v
AWS Amplify Hosted React Frontend
    |  Pages:
    |  Landing / Dataset Ingestion / Dashboard / SmartMatch
    |  AI Outreach / Response Tracking / Impact Story / API Settings
    |
    v
Frontend API Service Layer
    |  src/services/api.ts
    |  src/config/apiConfig.ts
    |  Mock Mode or AWS Connected Mode based on VITE_API_BASE_URL
    |
    v
Amazon API Gateway
    |  GET  /health
    |  GET  /dashboard
    |  POST /load-dataset
    |  POST /match
    |  POST /chat
    |  POST /response
    |  POST /impact-story
    |
    v
AWS Lambda Handlers
    |  backend/handlers/health.py
    |  backend/handlers/dashboard.py
    |  backend/handlers/load_dataset.py
    |  backend/handlers/match.py
    |  backend/handlers/chat.py
    |  backend/handlers/response.py
    |  backend/handlers/impact_story.py
    |
    v
Backend Service Layer
    |  common.py: responses, CORS, body parsing, JSON safety
    |  dynamodb_service.py: table access and safe writes
    |  dataset_service.py: CSV load, cleaning, dedupe, writes
    |  scoring_service.py: SmartMatch filtering and ranking
    |  bedrock_service.py: AI generation and fallback
    |  response_service.py: intent classification and escalation
    |
    +--> DynamoDB
    |       HemolyticsDonors
    |       HemolyticsRequests
    |       HemolyticsConversations
    |       HemolyticsResponses
    |
    +--> S3
    |       Dataset.csv
    |
    +--> AWS Bedrock
    |       Claude Haiku model invocation with safe fallback
    |
    +--> CloudWatch
            Lambda logs and safe diagnostics
```

## 4. Request-to-Response Flow

When a user interacts with Hemolytics:

1. The user opens the Amplify-hosted React app.
2. React Router in `src/App.tsx` renders the selected page inside `src/components/Layout.tsx`.
3. The page triggers a frontend service call from `src/services/api.ts`.
4. `src/config/apiConfig.ts` determines whether the app is in Mock Mode or AWS Connected Mode.
5. In AWS Connected Mode, the service layer sends a JSON request to the API Gateway base URL.
6. API Gateway routes the request to the matching Lambda function from `backend/handlers/`.
7. The handler handles CORS preflight if needed, parses JSON, validates required fields, and calls a backend service.
8. The backend service performs storage, dataset, scoring, AI, or response-classification logic.
9. DynamoDB, S3, Bedrock, and CloudWatch are used depending on the endpoint.
10. The handler returns a Lambda proxy JSON response using helpers in `backend/services/common.py`.
11. The frontend receives parsed JSON and updates loading, success, empty, or error UI state.

This request-to-response shape is consistent across the MVP, which makes the frontend/backend boundary easy to explain and test.

## 5. Frontend Architecture

The frontend is a React + Vite + TypeScript single-page application styled with Tailwind CSS.

Key files:

- `src/main.tsx` mounts the app and imports `src/index.css`.
- `src/App.tsx` defines application routes.
- `src/components/Layout.tsx` provides the global app shell.
- `src/components/ImpactSnapshot.tsx` provides reusable safe impact summary cards.
- `src/pages/*` contains feature pages.
- `src/services/api.ts` is the frontend service/API boundary.
- `src/config/apiConfig.ts` stores endpoint paths and reads `VITE_API_BASE_URL`.
- `src/store/useAppStore.ts` provides lightweight Zustand state.
- `src/types/index.ts` is the types entry file.
- `src/utils/*` contains local mock-mode helpers for scoring, response classification, escalation, dataset cleaning, and formatting.
- `src/data/mockData.ts` supports Mock Mode.

Routing:

- `src/App.tsx` uses `BrowserRouter`, nested routes, and redirects for route aliases.
- All feature pages render under `Layout`.
- The default route `/` is the Landing page.

Layout shell:

- Desktop uses a fixed 280px sidebar.
- Mobile uses a compact top bar and slide-out drawer.
- The sidebar includes logo/product identity, navigation, and backend status card.
- A dismissible safety banner repeats the medical/blood-safety boundary.
- A horizontally scrollable workflow step indicator links the main MVP stages.

Responsive design:

- Tailwind responsive utility classes are used throughout.
- Mobile-safe text wrapping is supported by helper CSS in `src/index.css`.
- Tables and dense endpoint/table content use mobile cards or scroll-safe layouts.
- Buttons are full-width or tap-friendly on small screens.

API behavior:

- `VITE_API_BASE_URL` determines mode.
- If the variable is set, pages call AWS endpoints.
- If absent, `src/services/api.ts` returns mock data or local utility results.

## 6. Frontend Page Architecture

| Page | File | Purpose | User Action | Data/API Dependency | Workflow Role | Safety Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | `src/pages/Landing.tsx` | Introduces Hemolytics and the MVP workflow | Start demo, run SmartMatch, view AWS connection | No direct API call; uses `ImpactSnapshot` | First-viewport explanation for judges/users | AI assists coordination only |
| Dataset Ingestion | `src/pages/DatasetIngestion.tsx` | Reloads S3 dataset into DynamoDB | Click `Load / Reload Dataset from S3` | `loadDataset()` -> `POST /load-dataset` | Starts data pipeline | Browser upload is not implemented; dataset metrics are coordination support only |
| Dashboard | `src/pages/Dashboard.tsx` | Shows donor/request/data quality analytics | Review metrics and navigate to next step | `getDashboard()` -> `GET /dashboard` | Operational overview | Uses sampled analytics, not confirmed medical outcomes |
| SmartMatch | `src/pages/SmartMatch.tsx` | Ranks donor candidates | Configure request and click `Run SmartMatch` | `runSmartMatch()` -> `POST /match` | Donor prioritization | Ranks contacts for coordinator review only |
| AI Outreach | `src/pages/AiOutreach.tsx` | Generates coordinator-ready copy | Select donor/request/tone/language, generate, copy, mark sent | `generateOutreachMessage()` -> `POST /chat` | Communication drafting | WhatsApp-style is tone only; no automatic sending |
| Response Tracking | `src/pages/ResponseTracking.tsx` | Classifies replies and shows escalation | Submit/test donor reply | `submitDonorResponse()` -> `POST /response` | Reply understanding and next action | Classification does not verify eligibility or donation completion |
| Impact Story | `src/pages/ImpactStory.tsx` | Generates anonymized awareness content | Enter campaign metrics/context and generate | `generateImpactStory()` -> `POST /impact-story` | Safe storytelling | No patient PII, no survival/medical outcome claims |
| API Settings | `src/pages/ApiSettings.tsx` | Shows AWS connection, endpoints, tables, model info | Inspect backend contract and mode | Reads frontend config; no primary API call | Demo transparency | States no credentials/secrets belong in frontend code |

## 7. Backend Architecture

The backend is a Python AWS Lambda application deployed with AWS SAM.

Key files:

- `backend/template.yaml` defines infrastructure.
- `backend/handlers/*` contains Lambda entrypoints.
- `backend/services/*` contains reusable service logic.
- `backend/scripts/*` contains deployment, packaging, smoke test, local handler, and Bedrock diagnostic helpers.
- `backend/events/*` contains local API Gateway proxy event samples.
- `backend/README.md` documents backend operations.
- `backend/requirements.txt` is minimal because Lambda includes `boto3`.
- `backend/samconfig.toml` supports SAM deployment configuration.

Backend layering:

```text
API Gateway route
    -> Lambda handler
    -> shared services
    -> AWS service or business logic
    -> common JSON response helper
```

Shared backend patterns:

- `handle_options` supports CORS preflight.
- `parse_json_body` centralizes request body parsing.
- `ok`, `bad_request`, and `server_error` standardize Lambda proxy responses.
- `decimal_to_float_safe` avoids JSON serialization issues with DynamoDB Decimal values.
- Handlers remain thin; service modules own the real logic.
- CloudWatch logs capture Lambda execution and safe Bedrock diagnostics.

## 8. Backend Handler Layer

| Handler | Endpoint | Responsibility | Service Dependencies | Frontend Consumer | Fallback/Error Behavior |
| --- | --- | --- | --- | --- | --- |
| `backend/handlers/health.py` | `GET /health` | Returns app health, version, architecture, region, and safety notice | `common.py` | API Settings / smoke tests | Handles `OPTIONS`; no external service dependency |
| `backend/handlers/dashboard.py` | `GET /dashboard` | Reads sampled donor/request data and returns dashboard metrics | `dynamodb_service.py`, `common.py` | Dashboard | Uses limited scans and returns server error if DynamoDB read fails |
| `backend/handlers/load_dataset.py` | `POST /load-dataset` | Parses request and loads dataset from S3 or rows | `dataset_service.py`, `common.py` | Dataset Ingestion | Bad request for invalid body/config; server error for unexpected load failure |
| `backend/handlers/match.py` | `POST /match` | Validates match request and ranks donors | `dynamodb_service.py`, `scoring_service.py`, `common.py` | SmartMatch | Bad request for missing blood group/coordinates; server error for scoring/read failure |
| `backend/handlers/chat.py` | `POST /chat` | Generates outreach copy and stores conversation | `bedrock_service.py`, `dynamodb_service.py`, `common.py` | AI Outreach | Bedrock service returns fallback; handler errors if generation/save fails unexpectedly |
| `backend/handlers/response.py` | `POST /response` | Classifies response and updates request status | `response_service.py`, `common.py` | Response Tracking | Bad request for missing request/donor; server error for persistence/update failure |
| `backend/handlers/impact_story.py` | `POST /impact-story` | Generates anonymized awareness content | `bedrock_service.py`, `common.py` | Impact Story | Bedrock service returns fallback; handler catches unexpected failures |

## 9. Backend Service Layer

| Service | Responsibility | Used By | Interacts With | Safety/Fallback Behavior |
| --- | --- | --- | --- | --- |
| `backend/services/common.py` | API Gateway proxy responses, CORS, JSON parsing, environment helpers, timestamps, normalization, Decimal/date conversion | All handlers and services | Runtime event/env data | Standardizes safe JSON and error shapes |
| `backend/services/dynamodb_service.py` | Table access, scans, limited scans, put/get/update, batch writes, primary-key defaults, Decimal conversion | Dashboard, Match, Chat, Response, Dataset | DynamoDB | Dedupe guard in batch writes prevents duplicate key batch failures |
| `backend/services/dataset_service.py` | CSV/S3 loading, row cleaning, blood group/date/number/status normalization, derived fields, donor dedupe, request generation | Load Dataset handler | S3 and DynamoDB | Flags invalid blood group/missing location; dedupes donor profiles by completeness |
| `backend/services/scoring_service.py` | Haversine distance, exact blood group matching, hard filters, score weights, confidence labels, top-5 ranking | Match handler | Donor records from DynamoDB | Excludes missing blood group, invalid location, and not-eligible donors from strict ranking |
| `backend/services/bedrock_service.py` | Bedrock Runtime invocation, Priya outreach generation, impact story generation, JSON parsing, safe fallbacks | Chat and Impact Story handlers | AWS Bedrock Runtime | No medical claims, no patient PII, fallback text if Bedrock/model access fails |
| `backend/services/response_service.py` | Intent classification, summary, next action, escalation, response record, request update | Response handler | DynamoDB requests/responses | Classifies confirm/decline/reschedule/no_response and escalates safely |

## 10. AWS Infrastructure Architecture

| AWS Service | Why It Is Used | Hemolytics Usage | Depends On It | MVP Limitation / Future Note |
| --- | --- | --- | --- | --- |
| AWS Amplify | Low-friction static frontend hosting from GitHub | Builds with `amplify.yml`, publishes `dist`, injects `VITE_API_BASE_URL` | All frontend pages | CloudFront/custom domain/security headers can be future hardening |
| Amazon API Gateway | Public HTTP boundary for Lambda backend | Exposes `/Prod` routes for all endpoints | Frontend API service layer | No custom authorizer or throttling policy documented yet |
| AWS Lambda | Serverless compute without managing servers | Seven Python handlers for health, dashboard, load, match, chat, response, impact | All backend API routes | Long-running/background work would need queues or orchestration later |
| Amazon DynamoDB | Serverless primary data store | Donors, requests, conversations, responses | Dashboard, SmartMatch, chat storage, response tracking | No GSIs/geospatial indexes yet |
| Amazon S3 | Dataset CSV storage | Stores `Dataset.csv` for ingestion | Dataset Ingestion | Browser upload is not part of MVP |
| AWS Bedrock | AWS-native AI generation | Outreach and Impact Story generation | AI Outreach, Impact Story | Model access can require fallback depending on account/region/model permissions |
| Amazon CloudWatch | Operational logging | Lambda execution logs and safe Bedrock diagnostics | Backend troubleshooting | No full alarms/dashboards documented yet |
| AWS SAM / CloudFormation | Repeatable backend infrastructure | Defines API, functions, tables, bucket, IAM, outputs | Backend deployment | Production stacks should add environment separation and stricter IAM |

## 11. Data Architecture

The dataset architecture starts with `Dataset.csv` stored in S3. The frontend does not upload CSV files directly. Instead, the Dataset Ingestion page calls `/load-dataset`, and Lambda reloads the S3 dataset into DynamoDB.

Data pipeline:

```text
S3 Dataset.csv
    -> load_dataset Lambda
    -> dataset_service.load_csv_from_s3
    -> clean_donor_row
    -> derive_donor_fields
    -> dedupe donors by user_id
    -> create bridge/request candidates
    -> batch write donors and requests to DynamoDB
    -> return load summary to frontend
```

Cleaning and derived fields include:

- Blood group normalization.
- Date parsing.
- Numeric conversion.
- Coordinate validation.
- Active/inactive status normalization.
- Eligibility status normalization.
- Valid blood group and location flags.
- Match eligibility flag.
- Donor experience score.
- Engagement score.
- Eligibility score.
- Location quality score.
- Re-engagement priority.
- Bridge/request candidate flag.

Known loaded metrics:

- 7,033 rows loaded.
- 6,946 unique users created.
- 87 duplicate groups handled.
- 2,036 invalid/unknown blood groups flagged.
- 24 missing locations flagged.
- 6,946 donor records written.
- 786 request records written.

Raw dataset contents are intentionally not included in documentation.

## 12. DynamoDB Table Architecture

| Table | Key Structure | Stored Entity | Used By | MVP Limitation | Possible Production Extension |
| --- | --- | --- | --- | --- | --- |
| `HemolyticsDonors` | Partition key `user_id` | Deduplicated donor/user profile with blood group, location, eligibility-like fields, active status, donation/call counts, scoring fields, data-quality flags | Dataset Ingestion, Dashboard, SmartMatch | Scan-based retrieval; no GSI/geospatial query path | GSIs for blood group/status/region, geospatial indexing, freshness fields |
| `HemolyticsRequests` | Partition key `request_id` | Bridge/request candidate with required blood group, quantity, date, status, and source | Dataset Ingestion, Dashboard, Response Tracking | Basic lifecycle state; no owner/assignee model | Request lifecycle table, coordinator assignment, status timeline |
| `HemolyticsResponses` | Partition key `response_id` | Donor reply classification, summary, next action, escalation metadata | Response Tracking | No webhook ingestion or external messaging correlation | Message IDs, webhook replies, audit events, coordinator review queue |
| `HemolyticsConversations` | Partition key `conversation_id`; TTL attribute configured | Generated outreach conversation record with donor/request IDs, message, model, provider, Bedrock flags | AI Outreach | Not a full communication audit trail | Outreach events, template IDs, approval status, delivery/read receipts |

DynamoDB uses `PAY_PER_REQUEST` billing in the SAM template. Relationships are logical and application-managed; DynamoDB does not enforce foreign keys.

## 13. API Architecture

| Route | Frontend Consumer | Lambda Handler | Backend Services | Main Response Type | Error/Fallback Behavior |
| --- | --- | --- | --- | --- | --- |
| `GET /health` | API Settings / smoke tests | `handlers.health.lambda_handler` | `common.py` | Health, app, version, architecture, region, safety | Simple JSON response; supports `OPTIONS` |
| `GET /dashboard` | Dashboard | `handlers.dashboard.lambda_handler` | `dynamodb_service.py`, `common.py` | Sampled metrics, distributions, top eligible pool, recent activity | Limited scans to avoid timeout; server error on read failure |
| `POST /load-dataset` | Dataset Ingestion | `handlers.load_dataset.lambda_handler` | `dataset_service.py`, `common.py` | Load summary and DynamoDB write counts | Bad request for invalid JSON/rows/config; server error for unexpected failures |
| `POST /match` | SmartMatch | `handlers.match.lambda_handler` | `dynamodb_service.py`, `scoring_service.py`, `common.py` | Ranked donor results and match metadata | Bad request for missing required fields; server error for match failure |
| `POST /chat` | AI Outreach | `handlers.chat.lambda_handler` | `bedrock_service.py`, `dynamodb_service.py`, `common.py` | Generated message, model/provider, conversation ID, safety notice, Bedrock flags | Bedrock fallback; server error for unexpected save/generation failure |
| `POST /response` | Response Tracking | `handlers.response.lambda_handler` | `response_service.py`, `common.py` | Detected intent, status, summary, next action, escalation fields | Bad request for missing request/donor; server error for persistence/update failure |
| `POST /impact-story` | Impact Story | `handlers.impact_story.lambda_handler` | `bedrock_service.py`, `common.py` | Awareness message, social post, coordinator summary, safety notice, Bedrock flags | Bedrock fallback; server error for unexpected failure |

All API responses are Lambda proxy responses with JSON bodies and CORS headers.

## 14. SmartMatch Architecture

SmartMatch connects frontend request inputs to backend donor ranking.

Flow:

```text
SmartMatch page
    -> runSmartMatch(request)
    -> POST /match
    -> match.py validates required blood group and coordinates
    -> dynamodb_service.get_donors()
    -> scoring_service.rank_donors()
    -> top 5 results
    -> frontend result cards
```

Input shape supports:

- `requestId` / `request_id`
- `requiredBloodGroup` / `required_blood_group`
- `latitude`
- `longitude`
- `city`
- `urgency`
- `quantityRequired` / `quantity_required`
- `neededBy` / `needed_by`

Candidate filtering:

- Blood group exact match.
- Eligibility status must be `eligible`.
- Active status must be `Active` for strict matches.
- Latitude/longitude must be valid.
- Missing blood group and `Do not Know` are excluded.

Scoring factors:

- Haversine distance and proximity score.
- Engagement score.
- Donor experience score.
- Eligibility score.
- Location quality score.

Weights:

- Proximity: 0.30
- Engagement: 0.25
- Experience: 0.15
- Eligibility: 0.15
- Location quality: 0.15

Fallback/no-result behavior:

- If fewer than five strict matches exist, active-status relaxation can add backup candidates.
- Backup candidates must still have valid blood group, eligible status, and valid location.
- If no candidates meet filters, the frontend can show an empty result state.

Safety boundary: SmartMatch ranks donors to contact first. It does not guarantee donor availability, donor eligibility, donor health, or blood safety.

## 15. AI Architecture

AI features are centralized in `backend/services/bedrock_service.py`.

Bedrock runtime path:

```text
AI Outreach page or Impact Story page
    -> src/services/api.ts
    -> POST /chat or POST /impact-story
    -> Lambda handler
    -> bedrock_service.generate_outreach_message or generate_impact_story
    -> boto3 bedrock-runtime invoke_model
    -> safe response or fallback
```

Implemented AI use cases:

- AI Outreach generates short Priya-style coordinator-ready donor messages.
- Impact Story generates anonymized awareness message, social post, and coordinator summary.

Safety design:

- The system prompt tells the model not to certify donor health.
- It does not certify blood safety.
- It does not make medical decisions.
- It does not imply guaranteed outcomes.
- It does not include patient PII.
- It asks only for availability and coordinator follow-up.

Fallback design:

- The backend tries configured model candidates.
- Bedrock exceptions are logged safely with error type, model ID, region, operation, and fallback status.
- Raw prompts, donor PII, request bodies, credentials, and secrets are not logged.
- Fallback messages still return the same frontend-required fields.

Important communication boundary:

- The MVP generates WhatsApp-style copy, but it does not send WhatsApp messages automatically.
- Copy/mark-as-sent behavior in the frontend is local coordinator workflow support, not production messaging integration.

## 16. Response Tracking Architecture

Response Tracking is a deterministic workflow service, not a generative AI route.

Flow:

```text
Response Tracking page
    -> submitDonorResponse(payload)
    -> POST /response
    -> response.py
    -> response_service.apply_response_to_request
    -> build_response_record
    -> put response in HemolyticsResponses
    -> update related HemolyticsRequests status when possible
    -> return visible analysis fields
```

Intent categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Coordinator actions:

- Confirmed donor: call donor and continue human-managed verification.
- Decline: escalate to next ranked donor.
- No response: escalate after response window.
- Reschedule: create follow-up and keep backup donors available.

Frontend rendering:

- Latest AI Response Analysis panel shows detected intent, status, escalation flag, next donor, summary, and next action.
- Visible state updates make confirm and decline scenarios demo-friendly.

## 17. Impact Story and Estimated Impact Architecture

Impact Story combines AI-generated awareness content with safe impact framing.

Components:

- `src/pages/ImpactStory.tsx`
- `src/components/ImpactSnapshot.tsx`
- `src/services/api.ts`
- `backend/handlers/impact_story.py`
- `backend/services/bedrock_service.py`

Impact Story output:

- `awarenessMessage`
- `socialPost`
- `coordinatorSummary`
- `safetyNotice`
- `bedrock_available`
- `fallback_used`

Estimated Impact Snapshot appears on:

- Landing page.
- Dashboard.
- Impact Story page.

Snapshot architecture:

- Accepts optional live metrics from page context.
- Uses safe fallback values from known load summary when live metrics are not provided.
- Presents records processed, unique records organized, request records identified, donor profiles prioritized, data quality flags, and coordinator time saved.

Safety boundaries:

- No patient PII.
- No confirmed lives-saved claims.
- No completed donation claims unless verified completion data exists.
- No donor medical approval.
- Metrics are coordination indicators only.

## 18. Error Handling and Resilience Architecture

Frontend resilience:

- Loading states appear during API calls.
- Error states are visible on Dataset Ingestion, SmartMatch, AI Outreach, Response Tracking, and Impact Story.
- Empty states guide users before a workflow runs.
- API errors are parsed in `src/services/api.ts`.
- Mock Mode keeps demos possible when `VITE_API_BASE_URL` is absent.

Backend resilience:

- `common.py` standardizes JSON responses.
- CORS headers support `GET`, `POST`, and `OPTIONS`.
- `handle_options` handles preflight requests safely.
- `parse_json_body` catches invalid JSON.
- `decimal_to_float_safe` prevents DynamoDB Decimal serialization failures.
- Dataset ingestion deduplicates donor keys and request keys.
- `batch_write_items` has a final duplicate-key safety guard.
- Dashboard uses limited scans and projection expressions to avoid timeout.
- Bedrock routes return fallback output if model invocation fails.
- CloudWatch logs include safe Bedrock diagnostics.

## 19. Security and Safety Architecture

Current MVP safety/security decisions:

- AWS credentials are not stored in code.
- Runtime configuration uses environment variables.
- `.gitignore` excludes `.env*`, except `.env.example`.
- Dataset CSV is ignored and should not be committed if it contains real/sensitive rows.
- `node_modules`, `dist`, SAM build artifacts, zip files, caches, and credentials are ignored.
- Frontend API URL is configured via `VITE_API_BASE_URL`.
- AI prompts and UI wording avoid medical claims.
- Impact content avoids patient PII.
- No automatic outreach sending is implemented.
- Human verification boundaries are repeated in layout, SmartMatch, AI Outreach, Impact Story, and docs.

Future security needs:

- Authentication.
- Role-based access control.
- PII masking.
- Audit logs.
- Least-privilege IAM per function.
- WAF and API rate limiting.
- Consent handling.
- Data retention policy.
- Compliance review for target operating context.

The current implementation should not be represented as compliant with healthcare or medical regulations unless that work is formally implemented and verified.

## 20. Deployment Architecture

Frontend deployment:

- Hosted through AWS Amplify.
- Source is GitHub branch `main`.
- `amplify.yml` runs:
  - `npm install`
  - `npm run build`
- Artifacts are published from `dist`.
- Amplify environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Backend deployment:

- Deployed through AWS SAM / CloudFormation.
- Template: `backend/template.yaml`.
- Script: `backend/scripts/deploy_sam.sh`.
- Manual path: `sam build --template-file backend/template.yaml` then `sam deploy --guided`.
- SAM outputs include API URL, table names, and dataset bucket.

Infrastructure outputs and runtime:

- API Gateway stage URL backs the frontend API service layer.
- S3 dataset bucket stores `Dataset.csv`.
- DynamoDB tables store application records.
- CloudWatch logs Lambda execution.
- Bedrock access must be enabled in the AWS account/region.

## 21. Local Development Architecture

Frontend local flow:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Mode behavior:

- Without `VITE_API_BASE_URL`, the frontend runs in Mock Mode.
- With `VITE_API_BASE_URL`, it calls the deployed AWS API.
- Local `.env.local` may be used but should not be committed.

Backend local/script flow:

- Syntax check: `python -m compileall backend`
- Local handler runner: `backend/scripts/run_local_handler.py`
- API smoke tester: `backend/scripts/test_api_endpoints.py`
- Bedrock diagnostic: `backend/scripts/test_bedrock.py`
- Sample events: `backend/events/*.json`
- Backend env reference: `backend/env.example`

No secrets should be committed through local development files.

## 22. Architecture Tradeoffs

Serverless backend:

- Benefit: low operational overhead, fast deployment, no server management.
- Tradeoff: synchronous Lambda workflows need timeout/memory attention.

DynamoDB scans and sampled analytics:

- Benefit: simple MVP data access without index design complexity.
- Tradeoff: full production analytics and geospatial matching need GSIs, precomputed aggregates, or background jobs.

Direct API Gateway + Lambda:

- Benefit: simple request path and clear deployment.
- Tradeoff: no middleware/auth layer yet.

S3-based dataset ingestion:

- Benefit: keeps browser upload out of scope and supports repeatable dataset reloads.
- Tradeoff: manual dataset upload remains outside the frontend.

Bedrock with fallback:

- Benefit: AI features remain AWS-native and resilient when model access fails.
- Tradeoff: fallback output may be less personalized than model-generated content.

Frontend-rendered workflow:

- Benefit: fast, judge-friendly interaction and clear user flow.
- Tradeoff: complex coordinator workflows will eventually need stronger backend state models.

No WhatsApp API yet:

- Benefit: avoids pretending a production messaging integration exists.
- Tradeoff: outreach sending and webhook replies remain manual/future work.

No auth/RBAC yet:

- Benefit: simpler hackathon demo.
- Tradeoff: production usage requires authentication, authorization, audit trails, and privacy controls.

## 23. Current Architecture Limitations

- Dashboard analytics are sampled.
- SmartMatch uses scan/ranking logic instead of optimized indexed geospatial queries.
- No DynamoDB GSIs or geospatial matching are implemented yet.
- No caching layer is implemented.
- No authentication or RBAC is implemented yet.
- No real WhatsApp sending is implemented.
- No donor availability calendar is implemented.
- No full request lifecycle state machine is implemented.
- Bedrock model access may require fallback.
- No production compliance certification is claimed.
- No WAF/rate-limit hardening is documented as implemented.
- No background queue or event bus is implemented.

## 24. Production Architecture Roadmap

The detailed production roadmap is maintained in:

[Future Enhancements and Production Roadmap](FUTURE_ENHANCEMENTS.md)

Future architecture upgrades could include:

- DynamoDB GSIs for blood group, active status, eligibility status, region, and request status.
- Geospatial indexing or location-aware candidate retrieval.
- EventBridge scheduled jobs.
- SQS queues for outreach, retries, and background processing.
- Step Functions for request lifecycle orchestration.
- DynamoDB Streams for event-driven updates.
- WhatsApp, SMS, and email integrations with webhooks.
- Authentication and RBAC.
- Audit logs.
- CloudWatch alarms and operational dashboards.
- WAF, rate limiting, and security hardening.
- Environment separation for dev, staging, and production.

These are roadmap items. They should not be described as already implemented in the current MVP.

## 25. Architecture Summary

Hemolytics is a live AWS-deployed hackathon MVP using a serverless architecture to connect data ingestion, donor intelligence, AI-assisted outreach, response tracking, and safe impact storytelling. The architecture is intentionally modular: React pages call a frontend service layer, API Gateway routes to thin Lambda handlers, backend services own data/scoring/AI logic, and AWS-managed services provide storage, model invocation, and logs.

The system is strongest when presented as coordinator decision support. It organizes data, prioritizes potential donor contacts, drafts safe communication, classifies responses, and supports anonymized awareness messaging. It does not certify donor health, donor eligibility, blood safety, donor availability, or medical outcomes. Production hardening should build on this serverless foundation with stronger security, indexing, workflow orchestration, communication integrations, and compliance review.
