# Hemolytics — Technical Documentation

## 1. Executive Summary

Hemolytics is a hackathon-built AI for Good blood donation coordination MVP for the Blood Warriors context. It helps coordinators move from donor/request data to dashboard intelligence, SmartMatch donor prioritization, coordinator-ready outreach, donor response understanding, escalation support, and anonymized awareness content.

The current system is a working AWS-deployed MVP. It includes a React + Vite + Tailwind frontend, an API Gateway + Lambda backend, DynamoDB tables, S3 dataset ingestion, AWS Bedrock AI generation with safe fallback behavior, and CloudWatch logging. It is designed as coordinator decision support, not as a production-certified healthcare or blood operations platform.

Safety boundary: Hemolytics does not certify donor health, donor eligibility, or blood safety. It does not guarantee donor availability or claim completed donations. Final decisions remain with authorized human coordinators, medical staff, hospitals, and blood bank processes.

## 2. Project Context

Hemolytics was built for the AI for Good / Blood Warriors context as a hackathon MVP focused on blood donation coordination. The project targets a real coordination workflow: load dataset records, understand donor/request readiness, prioritize donor contacts, draft safe outreach, classify replies, escalate when needed, and generate privacy-preserving awareness content.

The MVP is designed around:

- Coordinator decision support.
- Real dataset ingestion through S3 and Lambda.
- AWS-native serverless deployment.
- DynamoDB-first persistence.
- Bedrock-backed AI assistance with fallback behavior.
- Clear safety wording to avoid medical or outcome overclaims.

The project should be described as an operational coordination prototype. It demonstrates a useful workflow, but it should not be represented as a verified production healthcare platform or as evidence of real-world medical outcomes.

## 3. Problem Statement

Blood donation coordination has several practical challenges:

- Donor and request data can be fragmented across spreadsheets, manual records, phone calls, and coordinator notes.
- Coordinators need faster donor shortlisting when a request is time-sensitive.
- Donor availability is uncertain until a coordinator contacts the donor.
- Outreach language must be safe, human-verifiable, and free of medical claims.
- Donor replies need fast classification so coordinators can confirm, follow up, or escalate.
- Impact communication must avoid patient PII, false survival claims, and unverified donation outcomes.

Hemolytics addresses these coordination issues at MVP level by organizing records, ranking potential contacts, assisting outreach, classifying responses, and generating safe awareness messaging.

## 4. Solution Overview

Hemolytics implements a complete demo workflow:

1. Dataset Ingestion reloads `Dataset.csv` from S3 or accepts rows and writes cleaned records into DynamoDB.
2. Dashboard shows sampled donor/request metrics for fast demo analytics.
3. SmartMatch ranks top donor candidates for coordinator review.
4. AI Outreach generates short coordinator-ready donor messages through AWS Bedrock or safe fallback text.
5. Response Tracking classifies donor replies and suggests next coordinator action.
6. Impact Story generates anonymized awareness content and coordinator summaries.
7. Estimated Impact Snapshot presents coordination-support metrics without making medical outcome claims.
8. API Settings makes the AWS mode, endpoint map, DynamoDB tables, and safety notes visible for demos.

The frontend calls a service layer in `src/services/api.ts`, which switches between Mock Mode and AWS Connected Mode based on `VITE_API_BASE_URL`. The backend exposes Lambda proxy endpoints through API Gateway and organizes shared logic in `backend/services/`.

## 5. What Is Actually Built

### Landing Page

- File: `src/pages/Landing.tsx`
- Purpose: Introduces Hemolytics to judges and first-time users.
- Key user action: Start the demo, run SmartMatch, or view AWS connection details.
- Backend/API dependency: None directly; it uses static workflow content and `ImpactSnapshot`.
- Safety boundary: Presents AI as coordination support only and links impact metrics to coordination indicators.

### Dataset Ingestion

- File: `src/pages/DatasetIngestion.tsx`
- Purpose: Lets the user reload the S3-hosted dataset into DynamoDB through the backend.
- Key user action: Click `Load / Reload Dataset from S3`.
- Backend/API dependency: `loadDataset()` in `src/services/api.ts`, which calls `POST /load-dataset` in AWS Connected Mode.
- Safety boundary: Clarifies that browser CSV upload is not implemented; the browser triggers a backend reload from S3.

### Dashboard

- File: `src/pages/Dashboard.tsx`
- Purpose: Shows sampled donor network, dataset quality, active request, and re-engagement metrics.
- Key user action: Review operational readiness and navigate to SmartMatch or dataset reload.
- Backend/API dependency: `getDashboard()` calls `GET /dashboard`.
- Safety boundary: Dashboard metrics are sampled coordination indicators, not confirmed medical outcomes.

### SmartMatch

- File: `src/pages/SmartMatch.tsx`
- Purpose: Collects request criteria and ranks top donors for coordinator review.
- Key user action: Configure blood group, city, urgency, quantity, needed-by time, then click `Run SmartMatch`.
- Backend/API dependency: `runSmartMatch()` calls `POST /match`.
- Safety boundary: Ranking is not medical approval and does not guarantee availability, eligibility, or blood safety.

### AI Outreach

- File: `src/pages/AiOutreach.tsx`
- Purpose: Generates coordinator-ready donor outreach copy using the Priya coordinator persona.
- Key user action: Select request, donor, tone, language, then generate/copy/mark a message as sent.
- Backend/API dependency: `generateOutreachMessage()` calls `POST /chat`.
- Safety boundary: The page states that WhatsApp-style is a tone label only and no automatic WhatsApp sending occurs.

### Response Tracking

- File: `src/pages/ResponseTracking.tsx`
- Purpose: Classifies donor replies and makes the latest analysis visible.
- Key user action: Test a donor reply such as "Yes, I am available" or "Sorry, I cannot donate today".
- Backend/API dependency: `submitDonorResponse()` calls `POST /response`.
- Safety boundary: Classification supports coordinator action; it does not verify donor eligibility or complete a donation.

### Impact Story

- File: `src/pages/ImpactStory.tsx`
- Purpose: Generates anonymized awareness message, social post, and coordinator summary.
- Key user action: Enter campaign metrics/context and click generate.
- Backend/API dependency: `generateImpactStory()` calls `POST /impact-story`.
- Safety boundary: No patient PII, no medical approval, no blood safety certification, and no guaranteed outcomes.

### Estimated Impact Snapshot

- File: `src/components/ImpactSnapshot.tsx`
- Purpose: Shows coordination-support metrics in a safe visual format.
- Key user action: Read summarized dataset/workflow impact on Landing, Dashboard, and Impact Story.
- Backend/API dependency: Uses live dashboard/load values where passed; otherwise uses safe fallback values from the known dataset summary.
- Safety boundary: Explicitly labels metrics as estimated coordination indicators, not medical outcome claims.

### Responsive Layout/App Shell

- File: `src/components/Layout.tsx`
- Purpose: Provides desktop sidebar, mobile drawer, safety banner, and workflow step navigation.
- Key user action: Navigate between MVP pages.
- Backend/API dependency: None directly.
- Safety boundary: Global banner repeats the medical and blood safety limitation.

### Backend APIs

- Files: `backend/handlers/*.py`, `backend/services/*.py`, `backend/template.yaml`
- Purpose: Implements Lambda proxy endpoints for health, dashboard, dataset loading, matching, chat, response tracking, and impact story generation.
- Key user action: Triggered through frontend pages or smoke test scripts.
- Safety boundary: Shared safety notice and Bedrock prompts prevent medical approval or PII claims.

### AWS Deployment

- Files: `amplify.yml`, `backend/template.yaml`, `backend/scripts/deploy_sam.sh`, `backend/samconfig.toml`
- Purpose: Deploy frontend through Amplify and backend through SAM/CloudFormation.
- Key user action: Configure `VITE_API_BASE_URL`, deploy frontend, deploy backend, upload `Dataset.csv`, and test endpoints.
- Safety boundary: AWS credentials are not stored in code; `.env*`, dataset CSV, build output, SAM artifacts, and credentials are ignored.

## 6. Live System Links

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

## 7. Technology Stack

### Frontend

- React 18
- Vite
- TypeScript source files
- Tailwind CSS
- React Router DOM
- Zustand state store
- Lucide React icons
- Frontend service layer in `src/services/api.ts`
- Runtime API configuration in `src/config/apiConfig.ts`

### Backend

- Python 3.11 Lambda handlers
- AWS SAM / CloudFormation
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- AWS Bedrock Runtime through `boto3`
- Amazon CloudWatch Logs

### Deployment

- AWS Amplify Hosting for the static frontend.
- SAM/CloudFormation for API Gateway, Lambda, DynamoDB, S3, IAM, and outputs.
- GitHub as the source repository.

The project intentionally avoids PostgreSQL/RDS as primary storage, Redis, FastAPI as the primary backend, App Runner as the default runtime, mandatory Docker/ECR, direct Anthropic API calls, direct OpenAI API calls, production WhatsApp API, SageMaker pipelines, and a full community platform.

## 8. System Architecture

Runtime flow:

```text
Coordinator Browser
    |
    v
AWS Amplify Hosted React + Vite + Tailwind Frontend
    |
    v
src/services/api.ts
    |
    v
Amazon API Gateway /Prod
    |
    v
AWS Lambda Handlers in backend/handlers/
    |
    v
Backend Services in backend/services/
    |
    +--> DynamoDB: donors, requests, conversations, responses
    +--> S3: Dataset.csv ingestion source
    +--> AWS Bedrock Runtime: Claude Haiku generation
    +--> CloudWatch: Lambda logs and safe diagnostics
    |
    v
JSON API Response
    |
    v
Frontend UI loading/error/success states
```

The frontend is statically hosted and deployed independently from the backend. The backend is deployed through SAM and exposes a single API Gateway base URL. The browser never receives AWS credentials; it only calls the public API Gateway URL configured with `VITE_API_BASE_URL`.

## 9. Frontend Architecture

Main frontend files:

- `src/main.tsx` mounts the React app.
- `src/App.tsx` defines all routes inside `BrowserRouter`.
- `src/components/Layout.tsx` provides the app shell.
- `src/components/ImpactSnapshot.tsx` provides reusable coordination impact cards.
- `src/services/api.ts` contains API calls and Mock Mode fallbacks.
- `src/config/apiConfig.ts` reads `VITE_API_BASE_URL` and endpoint paths.
- `src/data/mockData.ts` supports Mock Mode.
- `src/utils/` contains local scoring, response classification, escalation, formatting, and dataset cleaning helpers used by frontend mock behavior.
- `src/store/useAppStore.ts` contains lightweight Zustand state for UI/session flags.

Implemented routes in `src/App.tsx`:

| Route | Page |
| --- | --- |
| `/` | Landing |
| `/dashboard` | Dashboard |
| `/dataset-ingestion` | Dataset Ingestion |
| `/dataset` | Redirect to Dataset Ingestion |
| `/smartmatch` | SmartMatch |
| `/ai-outreach` | AI Outreach |
| `/outreach` | Redirect to AI Outreach |
| `/response-tracking` | Response Tracking |
| `/responses` | Redirect to Response Tracking |
| `/impact-story` | Impact Story |
| `/impact` | Redirect to Impact Story |
| `/api-settings` | API Settings |

Layout behavior:

- Desktop uses a fixed expanded sidebar with logo, navigation, and backend card.
- Mobile hides the desktop sidebar and uses a top header plus slide-out drawer.
- A dismissible safety banner appears above page content.
- A horizontal workflow step indicator links Home, Dataset, Dashboard, SmartMatch, Outreach, Responses, Impact, and API pages.

Data behavior:

- If `VITE_API_BASE_URL` is set, `IS_AWS_CONNECTED` is true and pages call AWS endpoints.
- If `VITE_API_BASE_URL` is absent, the frontend uses mock data and local utility functions.
- Pages implement loading, error, and empty states for user-visible workflows.

## 10. Backend Architecture

Main backend files:

- `backend/template.yaml` defines SAM resources, API routes, Lambda configuration, DynamoDB tables, S3 bucket, IAM role, and outputs.
- `backend/handlers/` contains thin Lambda proxy handlers.
- `backend/services/` contains shared business logic.
- `backend/events/` contains API Gateway proxy-style local test events.
- `backend/scripts/run_local_handler.py` runs handlers locally with sample events.
- `backend/scripts/test_api_endpoints.py` smoke-tests deployed API endpoints.
- `backend/scripts/test_bedrock.py` tests direct Bedrock access with a tiny safe prompt.
- `backend/scripts/deploy_sam.sh` packages/builds/deploys the backend.

Handler pattern:

- Handle `OPTIONS` preflight through `handle_options`.
- Parse JSON with `parse_json_body`.
- Validate required request fields.
- Call service-layer logic.
- Return `ok`, `bad_request`, or `server_error`.

Common response pattern:

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  },
  "body": "{...JSON string...}"
}
```

Important shared backend behaviors:

- `backend/services/common.py` centralizes CORS, JSON responses, body parsing, environment lookup, timestamp creation, string normalization, and Decimal/date JSON conversion.
- `backend/services/dynamodb_service.py` converts floats to `Decimal` before writes and converts Decimal values back before JSON responses.
- `backend/services/bedrock_service.py` catches Bedrock failures and returns safe fallback output without logging prompts, PII, credentials, or secrets.
- CloudWatch receives Lambda logs, including safe Bedrock error type/model/region diagnostics.

## 11. API Documentation Summary

| Endpoint | Purpose | Handler | Input Summary | Output Summary | Frontend Page | Failure/Fallback Behavior |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /health` | Health and architecture metadata | `backend/handlers/health.py` | No body | `status`, `app`, `version`, `architecture`, `region`, `safety` | API Settings / smoke tests | Returns CORS-safe JSON; no external dependency beyond Lambda env |
| `GET /dashboard` | Fast sampled dashboard metrics | `backend/handlers/dashboard.py` | No body | record counts, active/eligible/missing metrics, distributions, top eligible pool, recent activity, `sampledRecords`, `dashboardMode` | Dashboard | Returns server error if DynamoDB scan fails |
| `POST /load-dataset` | Reload dataset from S3 or provided rows | `backend/handlers/load_dataset.py` | Optional `rows`; otherwise S3 bucket/key from env or body | load counts, duplicate handling, write counts, status, timestamp | Dataset Ingestion | Bad request for invalid rows/config; server error for load failure |
| `POST /match` | Rank top donors | `backend/handlers/match.py` | `requestId`, `requiredBloodGroup`, `latitude`, `longitude`, `city`, `urgency`, `quantityRequired`, `neededBy` | `results`, `matchTimeMs`, `totalCandidates`, `eligibleCandidates` | SmartMatch | Bad request for missing blood group/location; server error if matching fails |
| `POST /chat` | Generate outreach message | `backend/handlers/chat.py` | `donor`, `request`, optional `tone`, `language` | `message`, `model`, `provider`, `safetyNotice`, `conversationId`, Bedrock flags | AI Outreach | Bedrock failures return safe fallback; conversation save errors return server error |
| `POST /response` | Classify donor response | `backend/handlers/response.py` | `requestId`, `donorId`, `responseText`, `currentRank`, `rankedDonors` | `detectedIntent`, `responseStatus`, `aiSummary`, `nextAction`, escalation fields | Response Tracking | Bad request for missing request/donor; server error if persistence/update fails |
| `POST /impact-story` | Generate anonymized awareness content | `backend/handlers/impact_story.py` | donors contacted, responses, potential matches, city, blood group, safe context, tone | `awarenessMessage`, `socialPost`, `coordinatorSummary`, `safetyNotice`, Bedrock flags | Impact Story | Bedrock failures return safe fallback content |

The full endpoint documentation remains in `docs/API_DOCUMENTATION.md`.

## 12. Dataset Ingestion Pipeline

Dataset ingestion is implemented in `backend/services/dataset_service.py` and exposed through `POST /load-dataset`.

Pipeline:

1. The frontend Dataset Ingestion page calls `loadDataset()` in `src/services/api.ts`.
2. In AWS Connected Mode, the frontend posts to `/load-dataset`.
3. The Lambda handler parses the body.
4. If `rows` are supplied, they are loaded directly.
5. If no rows are supplied, the service reads `Dataset.csv` from S3 using `S3_DATASET_BUCKET` and `S3_DATASET_KEY`.
6. CSV rows are parsed with Python `csv.DictReader`.
7. Each row is cleaned and normalized.
8. Derived donor scoring and data-quality fields are added.
9. Donor profiles are deduplicated by `user_id`.
10. Bridge/request candidates are converted into request records with unique `request_id`.
11. Donors are written to `HemolyticsDonors`.
12. Requests are written to `HemolyticsRequests`.
13. The handler returns a load summary.

Cleaning and normalization includes:

- Blood group normalization such as `O+` to `O Positive`.
- Date parsing for known date formats.
- Numeric conversion for coordinates, quantity, donations, calls, frequency, and ratios.
- Active/inactive status normalization.
- Eligibility status normalization.
- Valid coordinate checks.
- Derived scoring fields such as `donor_experience_score`, `engagement_score`, `eligibility_score`, and `location_quality_score`.

Duplicate handling:

- Donor records are deduplicated by `user_id` before writing to `HemolyticsDonors`.
- The most complete row is selected using blood group validity, valid location, known eligibility, active status, donation count, call count, recent donation/contact date, and first-row fallback.
- `batch_write_items` also performs a final key-level dedupe before DynamoDB batch writes.
- Request records are not deduplicated only by user; they receive unique `request_id` values based on bridge ID, user ID, and row index when needed.

Known loaded metrics from the latest documented dataset load:

- 7,033 rows loaded.
- 6,946 unique users created.
- 87 duplicate groups handled.
- 2,036 invalid/unknown blood groups flagged.
- 24 missing locations flagged.
- 6,946 donor records written.
- 786 request records written.

Raw dataset contents are intentionally not documented here.

## 13. DynamoDB Data Model

DynamoDB tables are defined in `backend/template.yaml` and used through `backend/services/dynamodb_service.py`.

| Table | Partition Key | Purpose | Example Field Types | Feature Dependencies | Limitations |
| --- | --- | --- | --- | --- | --- |
| `HemolyticsDonors` | `user_id` | Deduplicated donor/user profiles from the dataset | blood group, role, eligibility status, active status, latitude/longitude, donations, total calls, engagement score, flags | Dashboard, SmartMatch, dataset reload | No GSI/geospatial index yet; matching scans and ranks in Lambda |
| `HemolyticsRequests` | `request_id` | Bridge/request candidate records extracted from dataset or updated through response tracking | required blood group, city/location, urgency, quantity, needed-by, status, source | Dashboard, SmartMatch context, Response Tracking | Request lifecycle is basic; no full coordinator ownership model |
| `HemolyticsConversations` | `conversation_id` | AI outreach conversation records | request ID, donor ID, generated message, model, provider, Bedrock flags, created timestamp | AI Outreach | TTL exists in SAM, but deeper audit workflow is future work |
| `HemolyticsResponses` | `response_id` | Donor response classification and escalation records | request ID, donor ID, response text, detected intent, status, summary, next action, escalation fields | Response Tracking | No webhook ingestion or external messaging integration yet |

DynamoDB relationships are application-managed. There are no relational foreign keys.

## 14. Dashboard Logic

The dashboard is designed for fast demo-speed analytics over the real dataset.

Files:

- Frontend: `src/pages/Dashboard.tsx`
- Backend: `backend/handlers/dashboard.py`
- DynamoDB helper: `backend/services/dynamodb_service.py`

The backend uses limited DynamoDB scans:

- Donor scan limit defaults to `DASHBOARD_SCAN_LIMIT=1000`.
- Request scan limit defaults to `DASHBOARD_REQUEST_SCAN_LIMIT=500`.
- Projection expressions fetch only needed fields when possible.
- If projection scanning fails, the handler falls back to a normal limited scan.

Returned dashboard metrics include:

- `totalRecords`
- `uniqueUsers`
- `totalDonorLikeUsers`
- `activeDonors`
- `inactiveDonors`
- `eligibleDonors`
- `notEligibleDonors`
- `missingBloodGroup`
- `missingLocation`
- `locationCoveragePercent`
- `reengagementCandidates`
- `activeBridgeCount`
- `bloodGroupDistribution`
- `roleDistribution`
- `topEligibleDonorPool`
- `recentActivity`
- `sampledRecords`
- `dashboardMode`

Sampling was added to prevent API Gateway 502/timeouts during live demos after loading the real dataset. This makes the dashboard responsive, but it is not a full production analytics engine. Production analytics would need query indexes, background aggregation, materialized summaries, or scheduled processing.

## 15. SmartMatch Logic

SmartMatch is implemented in:

- Frontend: `src/pages/SmartMatch.tsx`
- API service: `src/services/api.ts`
- Backend handler: `backend/handlers/match.py`
- Scoring: `backend/services/scoring_service.py`

Input request shape supports:

- `requestId` or `request_id`
- `requiredBloodGroup` or `required_blood_group`
- `latitude`
- `longitude`
- `city`
- `urgency`
- `quantityRequired` or `quantity_required`
- `neededBy` or `needed_by`

Backend flow:

1. Validate required blood group and coordinates.
2. Load donor records from DynamoDB.
3. Rank donors through `rank_donors`.
4. Return top matches, elapsed time, total candidates, and eligible candidate count.

Hard filters:

- Donor blood group must exactly match the requested blood group after normalization.
- `eligibility_status` must be `eligible`.
- `user_donation_active_status` must be `Active` for strict matches.
- Latitude and longitude must be valid.
- Donors with missing or `Do not Know` blood group are excluded.

Fallback behavior:

- If fewer than five strict matches are found, active-status relaxation can add backup candidates.
- Backup candidates must still have valid blood group, eligible status, and valid location.

Score factors:

- Proximity score from Haversine distance.
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

Output fields include:

- `rank`
- `donor_id`
- `user_id`
- `blood_group`
- `distance_km`
- `eligibility_status`
- `active_status`
- `donations_till_date`
- `total_calls`
- `calls_to_donations_ratio`
- `donor_type`
- `score`
- `match_score`
- `confidence_label`
- `reason_for_ranking`
- `reason`
- `recommended_action`

Safety boundary: SmartMatch ranks donors to contact first. It does not guarantee donor availability, donor eligibility, donor health, or blood safety.

## 16. AI Outreach Logic

AI Outreach is implemented in:

- Frontend: `src/pages/AiOutreach.tsx`
- API service: `src/services/api.ts`
- Backend handler: `backend/handlers/chat.py`
- Bedrock service: `backend/services/bedrock_service.py`

Purpose:

- Generate short, coordinator-ready donor outreach copy.
- Use a warm Priya-style Blood Warriors coordinator persona.
- Support tone and language selection in the UI.
- Save generated conversation records to `HemolyticsConversations`.

Important behavior:

- The frontend labels WhatsApp-style as a message tone only.
- The app does not send WhatsApp messages automatically.
- Users can copy the message or mark it as sent in the UI.
- Bedrock generation uses AWS Bedrock Runtime through `boto3`.
- If Bedrock fails, a safe fallback message is returned with `fallback_used: true`.

Bedrock safety prompt rules:

- Never certify donor health.
- Never certify blood safety.
- Never make medical decisions.
- Never imply guaranteed outcomes.
- Never include patient PII.
- Ask only for availability and coordinator follow-up.

Known model behavior from code/docs:

- Backend configuration defaults to `anthropic.claude-3-5-haiku-20241022-v1:0`.
- A fallback model ID environment variable is also supported.
- Bedrock errors are logged safely with error type, model ID, region, operation, and fallback status.
- Raw prompts, PII, credentials, and secrets are not logged.

## 17. Response Tracking Logic

Response Tracking is implemented in:

- Frontend: `src/pages/ResponseTracking.tsx`
- API service: `src/services/api.ts`
- Backend handler: `backend/handlers/response.py`
- Response service: `backend/services/response_service.py`

The user enters or tests donor reply text. The backend classifies intent by keyword rules:

- `confirm`: yes, available, I can come, ok, sure, confirmed.
- `decline`: no, not possible, unavailable, cannot, can't.
- `reschedule`: later, tomorrow, after, evening, another time, reschedule.
- `no_response`: empty, timeout, no response.

Status logic:

- confirm -> `donor_confirmed`
- decline -> escalate to next donor
- no response -> escalate to next donor after the response window
- reschedule -> `needs_follow_up`
- all donors failed -> `needs_coordinator_attention`

Persistence behavior:

- A response record is written to `HemolyticsResponses`.
- The related request in `HemolyticsRequests` is updated with status, update timestamp, and last response ID when possible.
- The frontend shows the latest AI response analysis so the status visibly changes after classification.

Safety boundary: Response classification helps coordinators decide next workflow steps. It does not verify donor medical eligibility or donation completion.

## 18. Impact Story Logic

Impact Story is implemented in:

- Frontend: `src/pages/ImpactStory.tsx`
- API service: `src/services/api.ts`
- Backend handler: `backend/handlers/impact_story.py`
- Bedrock service: `backend/services/bedrock_service.py`
- Shared visual metrics: `src/components/ImpactSnapshot.tsx`

Purpose:

- Generate anonymized awareness content.
- Produce an awareness message, social post, and coordinator summary.
- Explain coordination progress without exposing patient PII.
- Avoid unsafe claims such as guaranteed survival, certified blood safety, or completed donation outcomes.

Backend output:

- `awarenessMessage`
- `socialPost`
- `coordinatorSummary`
- `safetyNotice`
- `model`
- `provider`
- `bedrock_available`
- `fallback_used`
- Optional `bedrock_error_type` when fallback is used.

If Bedrock fails, the fallback output still returns all primary content fields so the UI can continue working.

## 19. Estimated Impact Snapshot

The Estimated Impact Snapshot was added as a safe way to communicate coordination-support value without overclaiming.

Files:

- `src/components/ImpactSnapshot.tsx`
- Used by `src/pages/Landing.tsx`
- Used by `src/pages/Dashboard.tsx`
- Used by `src/pages/ImpactStory.tsx`

Metrics shown when available:

- Dataset records processed.
- Unique people/user records organized.
- Request records identified.
- Donor profiles prioritized.
- Data quality flags.
- Coordinator time saved.
- Sampled dashboard context.
- Response/workflow context.

Known fallback values:

- 7,033 records processed.
- 6,946 unique records organized.
- 786 request records identified.
- 87 duplicate groups handled.
- 2,036 invalid/unknown blood groups flagged.
- 24 missing locations flagged.
- 1,000 sampled dashboard records.
- 905 active donors in sampled dashboard fallback context.
- 500 sampled active/bridge requests in fallback context.
- Top 5 donors ranked by SmartMatch.

The component avoids claiming that people were saved, donors were medically approved, blood was safe, or donations were completed.

## 20. Safety, Ethics, and Boundaries

Hemolytics does not:

- Certify donor health.
- Certify donor eligibility.
- Certify blood safety.
- Guarantee donor availability.
- Replace medical staff.
- Replace coordinators.
- Claim confirmed lives saved.
- Expose patient PII in impact content.

Hemolytics does:

- Organize donor and request data.
- Prioritize potential donor contacts.
- Assist outreach drafting.
- Classify donor responses.
- Suggest follow-up or escalation actions.
- Support anonymized awareness messaging.
- Provide coordination-support metrics.

Every AI-generated or ranked output should be treated as coordinator assistance. Final verification remains human-led.

## 21. Error Handling and Resilience

Frontend resilience:

- API calls are wrapped in `try/catch` page handlers.
- Pages show loading states while requests are in progress.
- Visible error panels appear for dataset loading, SmartMatch, AI Outreach, Response Tracking, and Impact Story.
- Empty states guide the user before a workflow has run.
- Mock Mode keeps the app usable without `VITE_API_BASE_URL`.

Backend resilience:

- All handlers use Lambda proxy JSON responses.
- CORS headers support `GET`, `POST`, and `OPTIONS`.
- JSON body parsing catches invalid payloads.
- DynamoDB float/Decimal conversion avoids serialization errors.
- Dataset duplicate `user_id` handling prevents duplicate key batch-write failures.
- Dashboard sampling prevents timeout-prone full scans.
- Bedrock fallback preserves outreach/story workflows when model access fails.
- CloudWatch receives safe diagnostics without secrets or PII.

## 22. Deployment and Infrastructure

Frontend deployment:

- Configured through `amplify.yml`.
- Amplify runs `npm install` and `npm run build`.
- Build output is `dist`.
- Production API URL should be configured as an Amplify environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Backend deployment:

- Deployed separately with AWS SAM.
- SAM template: `backend/template.yaml`.
- Deploy script: `backend/scripts/deploy_sam.sh`.
- Manual deploy path: `sam build --template-file backend/template.yaml` and `sam deploy --guided`.
- API Gateway stage output provides the frontend base URL.

AWS resources:

- API Gateway.
- Lambda functions.
- DynamoDB tables.
- S3 dataset bucket.
- IAM role for Lambda.
- Bedrock `InvokeModel` permission.
- CloudWatch logs.

Dataset:

- Upload `Dataset.csv` to the SAM output dataset bucket.
- The browser does not upload CSV directly to S3 in this MVP.
- The Dataset Ingestion page triggers Lambda to reload S3 data into DynamoDB.

## 23. Repository Structure

Readable repo map:

```text
.
|-- src/
|   |-- App.tsx                     # Route definitions
|   |-- main.tsx                    # React entry
|   |-- index.css                   # Tailwind and global styles
|   |-- components/
|   |   |-- Layout.tsx              # App shell, sidebar, drawer, safety banner
|   |   `-- ImpactSnapshot.tsx      # Reusable safe impact summary
|   |-- pages/                      # Landing, Dashboard, Dataset, SmartMatch, Outreach, Responses, Impact, API
|   |-- services/
|   |   `-- api.ts                  # Frontend API and Mock Mode service layer
|   |-- config/
|   |   `-- apiConfig.ts            # Runtime API base URL and endpoint constants
|   |-- store/
|   |   `-- useAppStore.ts          # Lightweight Zustand app state
|   |-- utils/                      # Local mock scoring/classification/formatting helpers
|   |-- data/
|   |   `-- mockData.ts             # Mock Mode data
|   `-- types/
|-- backend/
|   |-- handlers/                   # Lambda entrypoints
|   |-- services/                   # Shared backend logic
|   |-- scripts/                    # Deploy, local handler, smoke test, diagnostics
|   |-- events/                     # Local API Gateway sample events
|   |-- template.yaml               # SAM infrastructure
|   |-- samconfig.toml              # SAM config
|   |-- env.example                 # Backend env example
|   |-- requirements.txt            # Python dependency list
|   `-- README.md                   # Backend-specific docs
|-- docs/                           # Project documentation
|-- README.md                       # GitHub landing documentation
|-- amplify.yml                     # Amplify frontend build config
|-- package.json                    # Frontend package metadata/scripts
|-- tailwind.config.js              # Tailwind config
`-- postcss.config.js               # PostCSS config
```

## 24. Key Engineering Decisions

- Serverless AWS architecture: API Gateway + Lambda + DynamoDB + S3 keeps the MVP deployable without managing servers.
- React/Vite/Tailwind frontend: supports fast iteration, static hosting, and responsive UI.
- DynamoDB primary storage: fits the hackathon serverless architecture and avoids RDS operational overhead.
- S3 dataset ingestion: keeps the real CSV outside browser upload flow and lets Lambda normalize records.
- Sampled dashboard analytics: prevents timeouts and keeps demo interactions fast.
- SmartMatch in Lambda: simple enough for MVP while still using dataset-derived scoring fields.
- Bedrock-only AI integration: avoids direct third-party model API keys and keeps AI inside AWS IAM boundaries.
- Safe AI fallback: outreach and impact generation continue even when Bedrock model access is restricted.
- No automatic WhatsApp sending: prevents pretending a production communication integration exists.
- No medical approval claims: UI, prompts, and documentation preserve human verification.
- Documentation-first repository: docs explain how to run, deploy, evaluate, and extend the MVP.

## 25. Technical Challenges and Fixes

Documented or visible repo challenges and fixes:

- Deployment setup: SAM resources and scripts were organized so the backend deploys separately from Amplify frontend hosting.
- Dataset duplicate key issue: donor records are deduplicated by `user_id`, request IDs are made unique, and batch writes perform a final key dedupe.
- DynamoDB float issue: floats are converted to `Decimal` before writes and converted back for JSON responses.
- Dashboard timeout issue: dashboard switched to sampled limited scans with field projections and configurable limits.
- Tailwind/Amplify styling issue: `amplify.yml`, Tailwind directives, PostCSS, and build output are configured for production CSS generation.
- Mobile responsiveness/sidebar issue: `Layout.tsx` now uses a stable fixed desktop sidebar and separate mobile drawer.
- Bedrock model access/fallback issue: backend supports active model configuration, fallback model candidates, safe error logs, and deterministic fallback content.
- Safe impact wording issue: `ImpactSnapshot` and Impact Story content use coordination-support language rather than lives-saved or medical outcome language.

These are framed as engineering outcomes visible in the current repository and documentation, not as unverified production incident history.

## 26. Current Limitations

- Dashboard uses sampled analytics, not full production aggregation.
- SmartMatch uses scan/ranking logic, not production geospatial indexing.
- No DynamoDB GSIs or geospatial matching are implemented yet.
- No authentication or role-based access control is implemented.
- No real WhatsApp sending is implemented.
- No donor mobile app is implemented.
- No full request lifecycle UI is implemented.
- No donor availability calendar is implemented.
- Bedrock may fall back depending on AWS account/model permissions.
- No production compliance certification is claimed.
- No CI test suite, frontend unit tests, backend unit tests, or E2E tests are currently documented as implemented.

## 27. Future Enhancements Reference

The detailed production roadmap lives in:

[Future Enhancements and Production Roadmap](FUTURE_ENHANCEMENTS.md)

This technical document focuses on the actual built MVP. The roadmap document covers future coordinator workflow expansion, communication integrations, data model improvements, security/privacy work, advanced analytics, and production deployment strategy.

## 28. Demo Flow

Suggested concise demo script:

1. Landing: "Hemolytics is an AI-powered blood donation coordination MVP for Blood Warriors. It supports coordinators from dataset loading through matching, outreach, response tracking, and awareness content."
2. Dataset Ingestion: "The dataset is stored in S3. This button triggers Lambda to clean the CSV and reload DynamoDB. The latest load organized 6,946 unique users from 7,033 rows."
3. Dashboard: "The dashboard uses fast sampled analytics for demo-speed visibility into donor network, data quality, active requests, and re-engagement."
4. SmartMatch: "SmartMatch ranks donors to contact first using blood group, location, eligibility-like dataset indicators, active status, engagement, and experience. It is for coordinator review only."
5. AI Outreach: "The Priya coordinator persona drafts safe outreach copy. WhatsApp-style is a tone, not automatic WhatsApp sending."
6. Response Tracking: "A reply such as 'Yes, I am available' becomes confirm/donor_confirmed. A decline triggers escalation to the next donor."
7. Impact Story: "The app generates anonymized awareness content with no patient PII and no medical outcome claims."
8. API Settings: "This page shows AWS Connected Mode, the live API URL, implemented endpoints, DynamoDB tables, and safety configuration."

## 29. Content Reuse Notes

This technical documentation can be used as a base for:

- Medium article.
- Dev.to article.
- LinkedIn launch post.
- PPT explanation.
- Gemini visuals.
- NotebookLM summaries.
- Portfolio case study.

Those outputs should be created separately. This document is the technical source material, not the final marketing article, slide deck, prompt pack, or social post.

## 30. Final Technical Summary

Hemolytics is completed as a hackathon-ready, AWS-deployed MVP. It demonstrates donor/request data ingestion, sampled dashboard intelligence, SmartMatch donor prioritization, AI-assisted outreach, response tracking, escalation support, safe impact storytelling, and production roadmap readiness.

The project is strongest when presented honestly: it is a real working coordination-support system with a deployed frontend and backend, but it is not yet a full production healthcare operations platform. Its core value is helping coordinators organize records, prioritize outreach, understand responses, and communicate impact safely while preserving human-led medical and operational verification.
