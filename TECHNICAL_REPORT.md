# Hemolytics — Deep Technical Documentation Report

## 1. Title

# Hemolytics — Deep Technical Documentation Report

This report is a single technical source of truth for the Hemolytics MVP. It is based on direct inspection of the repository files, including the React frontend, AWS SAM backend, Lambda handlers, service layer, deployment scripts, and local sample events.

## 2. Executive Summary

Hemolytics is an AI-assisted blood donation coordination platform built for Blood Warriors and the AI for Good Hackathon. The product organizes donor and request data, surfaces dataset readiness, ranks donors for coordinator review, drafts safe outreach copy, classifies donor responses, suggests escalation actions, and generates anonymized awareness content.

The implemented architecture is:

```text
React + Vite + Tailwind frontend
-> AWS Amplify Hosting
-> Amazon API Gateway
-> AWS Lambda
-> Amazon DynamoDB
-> Amazon Bedrock Claude Haiku
-> Amazon S3
-> Amazon CloudWatch
```

The app is intentionally framed as coordinator decision support. It does not certify donor health, donor eligibility, or blood safety, and it does not make medical decisions. Human coordinators and authorized medical staff remain responsible for final verification.

## 3. Problem Statement

Blood donation coordination can become difficult when donor, request, bridge, eligibility, location, response, and outreach data are fragmented. A coordinator may need to answer several questions under time pressure:

- Which donor records are usable?
- Which request records need attention?
- Which donor should be contacted first?
- Which records have missing blood group or location data?
- How should outreach be written safely without patient PII?
- Did the donor confirm, decline, reschedule, or fail to respond?
- If a donor declines, who should be contacted next?
- How can awareness content be generated without unsafe medical claims?

Hemolytics addresses this as an operational coordination problem, not as a medical certification system.

## 4. Target Users

Primary users:

- Blood Warriors coordinators who manage donor/request workflows.
- Donor network managers who need dataset readiness and re-engagement visibility.
- Campaign and awareness teams who need anonymized impact messaging.

Future users:

- Patient-side participants, if a future verified workflow is built.
- Donor-side participants, if a donor mobile experience is added.
- Medical or verification staff, if role-based review and approval workflows are implemented.

## 5. What Is Actually Built

The repository implements the following features.

Landing page:

- File: `src/pages/Landing.tsx`
- Default route: `/`
- Explains Hemolytics for judges and first-time users.
- Shows workflow, architecture badge, safety principle, CTA buttons, and future roadmap.
- Includes the reusable Estimated Impact Snapshot.

Dataset Ingestion:

- File: `src/pages/DatasetIngestion.tsx`
- Route: `/dataset-ingestion`
- Calls `loadDataset()` from `src/services/api.ts`.
- Sends `POST /load-dataset` in AWS Connected Mode.
- Shows loading, error, retry, and successful load summary states.
- Clearly states that browser CSV upload is not part of this MVP; S3 upload is handled outside the browser.

Dashboard:

- File: `src/pages/Dashboard.tsx`
- Route: `/dashboard`
- Calls `getDashboard()`.
- Displays donor network, dataset quality, request pipeline, re-engagement, blood group distribution, role snapshot, recent activity, and top donor pool preview.
- Includes compact Estimated Impact Snapshot near the top.
- Explains sampled dashboard mode for demo-speed analytics.

SmartMatch:

- File: `src/pages/SmartMatch.tsx`
- Route: `/smartmatch`
- Calls `runSmartMatch()`.
- Collects request ID, blood group, city/location, urgency, quantity, and needed-by time.
- Displays hard filters, top ranked donors, match scores, confidence labels, reasons, and recommended actions.
- Frames output as coordinator review, not medical approval.

AI Outreach:

- File: `src/pages/AiOutreach.tsx`
- Route: `/ai-outreach`
- Calls `generateOutreachMessage()`.
- Uses a Priya/Blood Warriors coordinator persona in the UI and backend.
- Supports tone and language controls.
- Provides copy and "Mark as Sent" UI actions.
- Explicitly says WhatsApp-style is a tone label only and does not send WhatsApp automatically.

Response Tracking:

- File: `src/pages/ResponseTracking.tsx`
- Route: `/response-tracking`
- Calls `submitDonorResponse()`.
- Lets users test donor replies.
- Shows latest AI response analysis with detected intent, response status, escalation flag, next donor, AI summary, and next action.
- Displays response board as mobile cards and desktop table.

Impact Story:

- File: `src/pages/ImpactStory.tsx`
- Route: `/impact-story`
- Calls `generateImpactStory()`.
- Generates awareness message, social post, coordinator summary, safety notice, and fallback notice when applicable.
- Includes a Coordination Impact Summary using the reusable Estimated Impact Snapshot.
- Uses safe messaging rules: no patient PII, no medical claims, no guaranteed survival statements.

API Settings:

- File: `src/pages/ApiSettings.tsx`
- Route: `/api-settings`
- Shows AWS Connected Mode or Mock Mode.
- Lists API endpoints, DynamoDB tables, architecture, frontend environment variable, model display, and production readiness notes.

Estimated Impact Snapshot:

- File: `src/components/ImpactSnapshot.tsx`
- Reusable component used on Landing, Dashboard, and Impact Story.
- Displays coordination-support metrics such as records processed, unique user records organized, request records identified, donor profiles prioritized, data quality flags, and coordinator time saved.
- Explicitly states these are coordination-support metrics, not medical outcome claims.

Mobile responsive app shell:

- File: `src/components/Layout.tsx`
- Fixed expanded desktop sidebar.
- Mobile top bar and slide-out drawer.
- Horizontally scrollable step flow.
- Safety banner and responsive content wrapper.

AWS backend:

- Folder: `backend/`
- SAM template: `backend/template.yaml`
- Seven Lambda handlers with API Gateway routes.
- DynamoDB, S3, Bedrock, and CloudWatch integration.

## 6. Live Deployment Links

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

## 7. Full Product Workflow

The implemented MVP workflow is:

```text
Dataset ingestion
-> Dashboard intelligence
-> SmartMatch donor ranking
-> AI Outreach message generation
-> Response Tracking
-> Escalation/action suggestion
-> Impact Story and awareness generation
```

Detailed flow:

1. Dataset Ingestion loads `Dataset.csv` from S3 through Lambda into DynamoDB.
2. The backend cleans rows, normalizes fields, derives scoring signals, deduplicates donors by `user_id`, and writes request candidates.
3. Dashboard reads sampled DynamoDB donor/request records for fast analytics.
4. SmartMatch reads donor profiles and ranks the top donors for coordinator review.
5. AI Outreach generates coordinator-ready copy using AWS Bedrock or a safe fallback.
6. Response Tracking classifies donor replies and suggests the next coordinator action.
7. Escalation moves to the next donor when the current donor declines or does not respond.
8. Impact Story turns campaign inputs into anonymized awareness content and coordinator summaries.
9. API Settings gives visibility into backend endpoints, tables, AWS mode, and deployment contract.

## 8. Frontend Architecture

The frontend is a React + Vite application using TypeScript source files and Tailwind CSS.

Core files:

- `package.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/ImpactSnapshot.tsx`
- `src/services/api.ts`
- `src/config/apiConfig.ts`
- `src/store/useAppStore.ts`
- `src/pages/*`
- `src/utils/*`
- `src/index.css`
- `tailwind.config.js`

Package scripts in `package.json`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Main dependencies:

- `react`
- `react-dom`
- `react-router-dom`
- `zustand`
- `lucide-react`

Development/build dependencies:

- `vite`
- `typescript`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `@vitejs/plugin-react`

Routing:

- `src/App.tsx` uses `BrowserRouter`, `Routes`, `Route`, and `Navigate`.
- The root route renders `Layout`.
- The index route renders `Landing`.
- Compatibility aliases redirect `/dataset`, `/outreach`, `/responses`, and `/impact` to their current page routes.

Layout/app shell:

- `src/components/Layout.tsx` defines the navigation items and step flow.
- Desktop layout uses a fixed 280px sidebar and `md:pl-[280px]` main content offset.
- Mobile layout hides the desktop sidebar and uses a drawer controlled by local `mobileOpen` state.
- A dismissible safety notice appears under the header/sidebar area.

API service layer:

- `src/config/apiConfig.ts` reads `VITE_API_BASE_URL`.
- `IS_AWS_CONNECTED` is true when `VITE_API_BASE_URL` is set.
- `src/services/api.ts` uses a shared `apiFetch` helper for AWS calls.
- In Mock Mode, the service returns local mock data and local utility outputs.

State management:

- `src/store/useAppStore.ts` uses Zustand.
- It stores sidebar state, active request ID, selected donor ID, and dataset loaded state.
- Current layout uses local mobile drawer state; the store still contains sidebar state for broader app state compatibility.

Styling:

- `src/index.css` imports Google fonts, includes Tailwind directives, defines brand CSS variables, and sets global overflow/touch/mobile-safe text helpers.
- `tailwind.config.js` scans `index.html` and `src/**/*.{js,ts,jsx,tsx}` and adds an `xs` breakpoint at 390px.

Important frontend hygiene note:

- `src/types/index.ts` is empty in the inspected codebase, while multiple files import types from it. Vite can still transpile the app, but strict TypeScript checking would likely require this file to be completed.

## 9. Backend Architecture

The backend is an AWS SAM serverless application.

Core files:

- `backend/template.yaml`
- `backend/handlers/health.py`
- `backend/handlers/dashboard.py`
- `backend/handlers/load_dataset.py`
- `backend/handlers/match.py`
- `backend/handlers/chat.py`
- `backend/handlers/response.py`
- `backend/handlers/impact_story.py`
- `backend/services/common.py`
- `backend/services/dynamodb_service.py`
- `backend/services/dataset_service.py`
- `backend/services/scoring_service.py`
- `backend/services/bedrock_service.py`
- `backend/services/response_service.py`

SAM configuration:

- Runtime: `python3.11`
- CodeUri: `.`
- Stage: `Prod`
- Tracing: `Active`
- API CORS: `GET,POST,OPTIONS`
- Dashboard scan limits: `DASHBOARD_SCAN_LIMIT=1000`, `DASHBOARD_REQUEST_SCAN_LIMIT=500`

Handler pattern:

- Each handler checks `OPTIONS` using `handle_options`.
- Each JSON POST handler parses request body using `parse_json_body`.
- Responses are produced through `ok`, `bad_request`, or `server_error`.
- Responses include CORS headers and JSON bodies.

Services layer:

- `common.py` centralizes CORS, JSON response shape, body parsing, environment helpers, date helpers, and Decimal conversion.
- `dynamodb_service.py` centralizes DynamoDB resource creation, table names, safe Decimal conversion, scans, writes, updates, generated IDs, and batch write de-duplication.
- `dataset_service.py` handles CSV loading, row cleaning, derived fields, deduplication, request generation, and writes.
- `scoring_service.py` ranks donors using hard filters and weighted scoring.
- `bedrock_service.py` calls AWS Bedrock Runtime and returns safe fallbacks.
- `response_service.py` classifies responses, builds response records, determines escalation, writes responses, and updates request status.

CloudWatch logging:

- Lambda functions use standard Lambda logs.
- `bedrock_service.py` prints `BEDROCK_INVOKE_ERROR` with safe context: exception type, message, model ID, region, operation, and fallback status.
- It does not log full prompts, donor PII, AWS credentials, or secrets.

## 10. AWS Services Used

AWS Amplify:

- Hosts the static React frontend.
- Uses `amplify.yml`.
- Runs `npm install` and `npm run build`.
- Publishes `dist`.
- Receives `VITE_API_BASE_URL` as an environment variable.

Amazon API Gateway:

- Defined as `HemolyticsApi` in `backend/template.yaml`.
- Stage: `Prod`.
- Routes requests to Lambda handlers.
- CORS allows `GET,POST,OPTIONS`.

AWS Lambda:

- Seven functions implement the backend endpoints.
- Python runtime is `python3.11`.
- Functions use a shared IAM role.

Amazon DynamoDB:

- Primary serverless data store.
- Tables are pay-per-request.
- Stores donor profiles, request records, conversations, and responses.

Amazon S3:

- Stores `Dataset.csv`.
- The dataset bucket is private and generated by SAM unless a custom bucket name is provided.
- Dataset Ingestion Lambda reads the CSV from S3.

AWS Bedrock:

- Used through `boto3.client("bedrock-runtime")`.
- Model default in backend/SAM: `anthropic.claude-3-5-haiku-20241022-v1:0`.
- Used for AI Outreach and Impact Story.
- Includes safe fallback behavior if Bedrock access/model invocation fails.

Amazon CloudWatch:

- Stores Lambda logs.
- Used for runtime visibility and Bedrock diagnostic logs.

AWS SAM / CloudFormation:

- `backend/template.yaml` defines resources.
- `backend/scripts/deploy_sam.sh` runs compile checks, SAM build, and SAM deploy.

## 11. API Endpoints

Base URL:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

### GET /health

Purpose:

- Confirms API health and returns app/architecture metadata.

Handler:

- `backend/handlers/health.py`

Input shape summary:

- No request body.

Output shape summary:

- `status`
- `app`
- `version`
- `architecture`
- `region`
- `safety`

Frontend usage:

- Available through `getHealth()` in `src/services/api.ts`.
- API visibility is surfaced in `src/pages/ApiSettings.tsx`.

### GET /dashboard

Purpose:

- Returns fast sampled dashboard analytics from donor and request tables.

Handler:

- `backend/handlers/dashboard.py`

Input shape summary:

- No request body.

Output shape summary:

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

Frontend page:

- `src/pages/Dashboard.tsx`

### POST /load-dataset

Purpose:

- Loads the Blood Warriors dataset from S3 or from a provided `rows` array.
- Cleans, normalizes, deduplicates, and writes donor/request records to DynamoDB.

Handler:

- `backend/handlers/load_dataset.py`

Input shape summary:

```json
{}
```

or:

```json
{
  "rows": [
    {
      "user_id": "DONOR-001",
      "blood_group": "O+",
      "latitude": "17.3850",
      "longitude": "78.4867"
    }
  ]
}
```

Output shape summary:

- `rowsLoaded`
- `cleanedRows`
- `uniqueUsersCreated`
- `duplicateGroupsHandled`
- `duplicate_user_ids_detected`
- `donor_deduplication_applied`
- `invalidBloodGroupsFlagged`
- `missingLocationFlagged`
- `donorsWrittenToHemolyticsDonors`
- `requestsWrittenToHemolyticsRequests`
- `loadStatus`
- `timestamp`

Frontend page:

- `src/pages/DatasetIngestion.tsx`

### POST /match

Purpose:

- Runs SmartMatch donor ranking.

Handler:

- `backend/handlers/match.py`

Input shape summary:

```json
{
  "requestId": "REQ-001",
  "requiredBloodGroup": "O Positive",
  "latitude": 17.385,
  "longitude": 78.4867,
  "city": "Hyderabad",
  "urgency": "Critical",
  "quantityRequired": 1,
  "neededBy": "2026-06-20"
}
```

Output shape summary:

- `results`
- `matchTimeMs`
- `totalCandidates`
- `eligibleCandidates`

Each result can include:

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
- `recommended_action`

Frontend page:

- `src/pages/SmartMatch.tsx`

### POST /chat

Purpose:

- Generates a safe donor outreach message for coordinator use.

Handler:

- `backend/handlers/chat.py`

Input shape summary:

```json
{
  "donor": {
    "user_id": "DONOR-001",
    "name": "Asha Rao",
    "blood_group": "O Positive"
  },
  "request": {
    "request_id": "REQ-001",
    "required_blood_group": "O Positive",
    "city": "Hyderabad",
    "urgency": "Critical",
    "quantity_required": 1
  },
  "tone": "WhatsApp-style",
  "language": "English",
  "coordinatorPersona": "Priya"
}
```

Output shape summary:

- `message`
- `model`
- `provider`
- `safetyNotice`
- `bedrock_available`
- `fallback_used`
- `bedrock_error_type` when fallback occurs
- `conversationId`

Frontend page:

- `src/pages/AiOutreach.tsx`

### POST /response

Purpose:

- Classifies donor response and determines next action/escalation.

Handler:

- `backend/handlers/response.py`

Input shape summary:

```json
{
  "requestId": "REQ-001",
  "donorId": "DONOR-001",
  "responseText": "No, not possible today",
  "currentRank": 1,
  "rankedDonors": [
    { "rank": 1, "donor_id": "DONOR-001" },
    { "rank": 2, "donor_id": "DONOR-002" }
  ]
}
```

Output shape summary:

- `detectedIntent`
- `responseStatus`
- `aiSummary`
- `nextAction`
- `escalationTriggered`
- `nextDonorId`
- `updatedRequestStatus`

Frontend page:

- `src/pages/ResponseTracking.tsx`

### POST /impact-story

Purpose:

- Generates anonymized awareness content, social post copy, and coordinator summary.

Handler:

- `backend/handlers/impact_story.py`

Input shape summary:

```json
{
  "donorsContacted": 25,
  "responsesReceived": 8,
  "potentialMatches": 3,
  "campaignCity": "Hyderabad",
  "bloodGroup": "O Positive",
  "patientSafeContext": "Recurring transfusion support request, anonymized",
  "tone": "warm"
}
```

Output shape summary:

- `awarenessMessage`
- `socialPost`
- `coordinatorSummary`
- `safetyNotice`
- `model`
- `provider`
- `bedrock_available`
- `fallback_used`
- `bedrock_error_type` when fallback occurs

Frontend page:

- `src/pages/ImpactStory.tsx`

## 12. Dataset Ingestion Pipeline

The dataset pipeline is implemented mainly in:

- `src/pages/DatasetIngestion.tsx`
- `src/services/api.ts`
- `backend/handlers/load_dataset.py`
- `backend/services/dataset_service.py`
- `backend/services/dynamodb_service.py`

Flow:

1. The browser user clicks "Load / Reload Dataset from S3".
2. The frontend calls `loadDataset()` in `src/services/api.ts`.
3. In AWS Connected Mode, the service sends `POST /load-dataset`.
4. `backend/handlers/load_dataset.py` parses the body and calls `load_dataset()`.
5. `backend/services/dataset_service.py` either:
   - reads `rows` from the body, or
   - loads `Dataset.csv` from S3 using `S3_DATASET_BUCKET` and `S3_DATASET_KEY`.
6. Each raw row is cleaned with `clean_donor_row`.
7. Fields are normalized:
   - blood group
   - dates
   - numeric fields
   - coordinates
   - eligibility status
   - active status
8. Derived fields are added:
   - `has_valid_blood_group`
   - `has_valid_location`
   - `is_match_eligible`
   - `donor_experience_score`
   - `engagement_score`
   - `eligibility_score`
   - `location_quality_score`
   - `reengagement_priority`
   - `bridge_request_candidate`
9. Donors are deduplicated by `user_id`.
10. Request records are generated from bridge/request candidate rows.
11. Donor profiles are written to `HemolyticsDonors`.
12. Request records are written to `HemolyticsRequests`.

Duplicate key handling:

- DynamoDB `BatchWriteItem` cannot contain duplicate primary keys in the same write batch.
- `dataset_service.py` deduplicates donor profiles by `user_id` before writing.
- `dynamodb_service.py` also supports `batch_write_items(table_name, items, key_name)` and deduplicates defensively by key before batch writing.
- Request records are not deduplicated only by `user_id`; they use unique `request_id` values.

Current loaded metrics documented by the user/API verification:

- 7,033 rows loaded
- 6,946 unique users created
- 87 duplicate groups handled
- 2,036 invalid/unknown blood groups flagged
- 24 missing locations flagged
- 6,946 donors written
- 786 requests written

## 13. DynamoDB Data Model

The DynamoDB tables are defined in `backend/template.yaml`.

### HemolyticsDonors

Purpose:

- Stores deduplicated donor/user profiles.

Primary key:

- `user_id`

Type of data:

- Cleaned dataset fields.
- Blood group and location.
- Eligibility and active status.
- Donation/call history.
- Derived scoring and quality flags.

Features using it:

- Dashboard
- SmartMatch
- Dataset Ingestion
- Estimated Impact Snapshot indirectly through dashboard/dataset metrics

### HemolyticsRequests

Purpose:

- Stores request or bridge candidate records derived from dataset rows.

Primary key:

- `request_id`

Type of data:

- Required blood group.
- City/location fields when available.
- Quantity required.
- Needed-by date.
- Request/bridge status.
- Source metadata.

Features using it:

- Dashboard
- Response Tracking request updates
- Dataset Ingestion
- SmartMatch request context from frontend input

### HemolyticsResponses

Purpose:

- Stores classified donor responses.

Primary key:

- `response_id`

Type of data:

- Request ID.
- Donor ID.
- Original response text.
- Detected intent.
- Response status.
- AI summary.
- Next action.
- Escalation flag.
- Next donor ID.
- Created timestamp.

Features using it:

- Response Tracking
- Escalation/action suggestion

### HemolyticsConversations

Purpose:

- Stores outreach conversation records generated by `/chat`.

Primary key:

- `conversation_id`

Other table feature:

- TTL attribute: `ttl`

Type of data:

- Request ID.
- Donor ID.
- Message.
- Model/provider metadata.
- Bedrock availability/fallback flags.
- Created timestamp.

Features using it:

- AI Outreach
- Coordinator audit trail candidate for future productionization

## 14. SmartMatch Logic

SmartMatch is implemented in:

- Frontend mock utility: `src/utils/scoring.ts`
- Backend service: `backend/services/scoring_service.py`
- Handler: `backend/handlers/match.py`
- Page: `src/pages/SmartMatch.tsx`

What SmartMatch does:

- Ranks donor profiles for coordinator review.
- Uses blood group, eligibility, active status, valid coordinates, distance, engagement, donation history, and data quality signals.
- Returns top candidates with ranking reasons and recommended actions.

What SmartMatch does not do:

- It does not medically approve a donor.
- It does not certify donor health.
- It does not certify blood safety.
- It does not guarantee donor availability.
- It does not replace coordinator or medical verification.

Backend hard filters:

- Donor must have a blood group.
- Blood group must not be `Do not Know`.
- Donor blood group must exactly match required blood group.
- `eligibility_status` must be `eligible`.
- `user_donation_active_status` must be `Active` for strict ranking.
- Latitude and longitude must be valid.

Fallback relaxation:

- If fewer than 5 strict matches exist, the backend can relax active status for backup candidates.
- Backup candidates still require valid blood group, eligibility, and valid location.
- Relaxed candidates are labeled for coordinator review and active-status confirmation.

Scoring factors:

- Proximity score based on Haversine distance.
- Engagement score from active status, total calls, and calls-to-donations ratio.
- Donor experience score from donations till date.
- Eligibility score.
- Location quality score.

Backend weights:

- Proximity: 30%
- Engagement: 25%
- Experience: 15%
- Eligibility: 15%
- Location quality: 15%

Output fields:

- Rank
- Donor ID/user ID
- Blood group
- Distance in km
- Eligibility status
- Active status
- Donation count
- Total calls
- Calls-to-donations ratio
- Donor type
- Score/match score
- Confidence label
- Reason for ranking
- Recommended action

Coordinator decision support boundary:

- The language in backend `recommended_action` says "Prioritized for coordinator review" and requires human verification of availability, logistics, and eligibility.

## 15. AI Outreach Logic

AI Outreach is implemented in:

- Page: `src/pages/AiOutreach.tsx`
- API client: `src/services/api.ts`
- Handler: `backend/handlers/chat.py`
- Bedrock service: `backend/services/bedrock_service.py`

Purpose:

- Generate short, safe, coordinator-ready donor outreach copy.

Persona:

- Priya, a warm Blood Warriors coordinator assistant.
- Backend system prompt instructs Priya to keep messages short, safe, and WhatsApp-style when requested.

Bedrock integration:

- Uses `boto3.client("bedrock-runtime", region_name=AWS_BEDROCK_REGION)`.
- Calls `invoke_model`.
- Sends Claude-compatible Bedrock body:

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 300,
  "temperature": 0.7,
  "system": "...",
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

Model configuration:

- Backend/SAM default: `anthropic.claude-3-5-haiku-20241022-v1:0`.
- Frontend display constant in `src/config/apiConfig.ts`: `anthropic.claude-3-haiku-20240307-v1:0`.
- The backend/SAM environment is authoritative for deployed Bedrock invocation.

Fallback behavior:

- If Bedrock fails, `generate_outreach_message` returns a safe fallback message.
- Response includes `bedrock_available: false`, `fallback_used: true`, and `bedrock_error_type`.
- The frontend shows "Safe fallback message used" when applicable.

WhatsApp boundary:

- The app generates WhatsApp-style copy only.
- It does not send messages through a production WhatsApp API.
- "Mark as Sent" is a local UI state, not a production send action.

Safety language:

- No medical approval.
- No blood safety certification.
- No guaranteed outcome.
- No patient PII.
- Final checks remain human-led.

Known Bedrock limitation:

- The code includes fallback behavior and diagnostics because AWS account/model access or model path restrictions can prevent direct Bedrock invocation.
- `backend/scripts/test_bedrock.py` provides a direct diagnostic prompt.

## 16. Response Tracking Logic

Response Tracking is implemented in:

- Page: `src/pages/ResponseTracking.tsx`
- Frontend mock utility: `src/utils/responseClassifier.ts`
- Frontend escalation utility: `src/utils/escalation.ts`
- API client: `src/services/api.ts`
- Handler: `backend/handlers/response.py`
- Backend service: `backend/services/response_service.py`

Intent classes:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Backend keyword behavior:

- Confirm: yes, available, I can come, ok, sure, confirmed
- Decline: no, not possible, unavailable, cannot, can't
- Reschedule: later, tomorrow, after, evening, another time, reschedule
- No response: empty, timeout, no response, unclassified text

Suggested coordinator actions:

- Confirm: call donor and continue coordinator-managed eligibility/logistics checks.
- Decline: escalate to next ranked donor and keep request open.
- No response: escalate when the response window has passed.
- Reschedule: create coordinator follow-up and keep backup donors available.

Escalation behavior:

- Confirm -> `donor_confirmed`
- Reschedule -> `needs_follow_up`
- Decline/no response -> `escalate_to_next_donor` if another ranked donor exists.
- If no donors remain -> `needs_coordinator_attention`

Storage:

- Response records are written to `HemolyticsResponses`.
- The service attempts to update the corresponding request in `HemolyticsRequests`.

Human verification:

- AI classifies and summarizes responses.
- Coordinators remain responsible for confirming donor availability, logistics, eligibility, and next steps.

## 17. Impact Story Logic

Impact Story is implemented in:

- Page: `src/pages/ImpactStory.tsx`
- API client: `src/services/api.ts`
- Handler: `backend/handlers/impact_story.py`
- Bedrock service: `backend/services/bedrock_service.py`
- Reusable snapshot: `src/components/ImpactSnapshot.tsx`

Purpose:

- Generate anonymized awareness and coordinator summary content from campaign activity.

Inputs:

- Donors contacted
- Responses received
- Potential matches
- Campaign city
- Blood group
- Patient-safe anonymized context
- Tone

Outputs:

- Awareness message
- Social post
- Coordinator summary
- Safety notice
- Bedrock/fallback flags

Safety behavior:

- Prompts instruct Bedrock not to include patient PII.
- Prompts forbid medical approval, blood safety certification, and guaranteed outcomes.
- Fallback content is anonymized and framed as coordinator review.

Estimated Impact Snapshot:

- The page includes a "Coordination Impact Summary" section.
- It converts contacted donors, responses, and potential matches into safe awareness context.
- It explicitly says no patient PII and no medical outcome claims.

## 18. Estimated Impact Snapshot

Implemented in:

- `src/components/ImpactSnapshot.tsx`

Used by:

- `src/pages/Landing.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ImpactStory.tsx`

Why it exists:

- Judges and coordinators need a quick visual summary of what the system organized and supported.
- The app needs to communicate potential coordination value without implying medical outcomes.

Metrics shown:

- Records Processed
- Unique People/User Records Organized
- Request Records Identified
- Donor Profiles Prioritized
- Data Quality Flags
- Coordinator Time Saved

Fallback metrics in the component:

- 7,033 records processed
- 6,946 unique records organized
- 786 request records identified
- 87 duplicate groups handled
- 2,036 invalid/unknown blood groups flagged
- 24 missing locations flagged
- 1,000 sampled dashboard records
- 905 active donors in sample
- 500 sampled active/bridge requests
- Top 5 donor profiles prioritized

Claims avoided:

- No claim that people were saved.
- No claim that donors were medically approved.
- No claim that blood was safe.
- No claim that donations were completed.
- No medical outcome claims.

Safe wording:

- "coordination-support metrics"
- "not medical outcome claims"
- "organized for faster coordinator review"
- "prioritized for coordinator review"
- "SmartMatch ranks donors to contact first, not guaranteed available donors"

## 19. Safety and Ethical Boundaries

Hemolytics has explicit safety boundaries across frontend and backend.

The app does not:

- Certify donor health.
- Certify donor eligibility.
- Certify blood safety.
- Make medical decisions.
- Guarantee donor availability.
- Promise patient outcomes.
- Include patient PII in generated awareness content.
- Send production WhatsApp messages.

The app does:

- Assist with data organization.
- Assist with donor prioritization for coordinator review.
- Assist with safe outreach drafting.
- Assist with response classification.
- Assist with escalation/action suggestions.
- Assist with anonymized awareness messaging.

Final decisions remain with authorized humans, coordinators, and medical staff.

SmartMatch boundary:

- SmartMatch ranks donors to contact first.
- It does not confirm that a donor can donate.
- It does not confirm medical eligibility.

Impact Story boundary:

- Impact Story creates awareness messages and coordinator summaries.
- It avoids patient PII and medical outcome claims.

## 20. Error Handling and Resilience

Frontend:

- Dataset Ingestion has loading, success, error, and retry UI states.
- Dashboard has loading and error UI states.
- SmartMatch has loading, empty, and error UI states.
- AI Outreach has loading and error UI states.
- Response Tracking has loading and error UI states for response analysis.
- Impact Story has loading, generated, empty, and error UI states.
- Mock Mode keeps the app usable when `VITE_API_BASE_URL` is not set.

Backend:

- `services/common.py` standardizes JSON responses and CORS headers.
- `parse_json_body` handles base64 and invalid JSON errors.
- Handlers return `bad_request` for invalid/missing inputs.
- Handlers return `server_error` for unexpected service failures.

Dataset duplicate handling:

- Donor deduplication occurs before writing to `HemolyticsDonors`.
- Batch writes include a final dedupe safety guard by primary key.
- Request IDs are generated to avoid duplicate request keys.

Dashboard timeout resilience:

- Dashboard uses limited scans.
- Environment variables control donor and request sample size.
- The response includes `dashboardMode: "sampled"`.

Bedrock fallback:

- AI Outreach and Impact Story catch Bedrock exceptions.
- Safe fallback content is returned.
- API responses include `bedrock_available` and `fallback_used`.
- Non-sensitive error type is returned when available.

CloudWatch diagnostics:

- Bedrock errors are printed as `BEDROCK_INVOKE_ERROR`.
- Logs include exception class, message, model ID, region, operation, and fallback status.
- Logs do not include full prompt, secrets, credentials, or request bodies.

## 21. Mobile Responsiveness

Mobile responsiveness is implemented through:

- `src/components/Layout.tsx`
- `src/index.css`
- Tailwind responsive classes in page components
- `tailwind.config.js` `xs` breakpoint

Key behavior:

- Desktop sidebar is fixed and always expanded at `md` and above.
- Mobile hides the desktop sidebar.
- Mobile uses a top bar with a menu button.
- Drawer opens over content and closes after navigation.
- Step flow is horizontally scrollable.
- Cards and forms stack vertically on smaller screens.
- Tables are converted to mobile cards or wrapped in horizontal scroll containers.
- `.mobile-safe-text` wraps long IDs and generated text.
- Global CSS sets `overflow-x: hidden` on `html`, `body`, and `#root`.

Goal:

- Feasible phone/mobile usage at common widths without horizontal overflow.

## 22. Repository and Deployment Hygiene

Repository hygiene:

- `.gitignore` excludes `node_modules/`, `dist/`, `.env*`, `Dataset.csv`, zip files, SAM artifacts, pycache files, AWS credential patterns, and `.DS_Store`.
- `.env.example` is allowed as a safe example.
- Dataset contents are not included in this report.
- No secrets are required in frontend code.

Frontend deployment:

- `amplify.yml` installs dependencies and runs `npm run build`.
- Artifact directory is `dist`.
- Amplify should set:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Backend deployment:

- `backend/scripts/deploy_sam.sh` runs:
  - Python compile checks
  - `sam build --template-file backend/template.yaml`
  - `sam deploy` or `sam deploy --guided`
- SAM outputs API URL, table names, and dataset bucket name.

Local/API checks:

- `backend/scripts/run_local_handler.py` runs local handler events.
- `backend/scripts/test_api_endpoints.py` smoke-tests deployed endpoints.
- `backend/scripts/test_bedrock.py` diagnoses Bedrock access/model invocation.

## 23. Current Known Limitations

Current limitations based on code inspection:

- AI Outreach may use safe fallback if Bedrock model access or model path is restricted.
- Dashboard uses sampled analytics for speed, not full dataset aggregation.
- SmartMatch is scan/ranking based, not production geospatial-index optimized.
- No production WhatsApp sending is implemented.
- No authentication or role-based access control is implemented.
- No donor mobile app is implemented.
- No push, SMS, or email notification integration is implemented.
- No full audit approval workflow is implemented.
- No background job scheduling is implemented.
- No DynamoDB GSIs are defined in `backend/template.yaml`.
- No frontend or backend automated unit test suite is present.
- `src/types/index.ts` is empty despite type imports in the frontend.
- The frontend model display constant differs from the backend SAM model default; backend environment remains authoritative for actual Bedrock invocation.
- Some mock/demo frontend text is more optimistic than production safety wording; production-facing copy and backend responses should continue to prefer conservative coordinator-support wording.

## 24. Production Roadmap

Recommended production roadmap:

- WhatsApp Business API integration.
- Patient/coordinator notifications.
- Donor-side mobile experience.
- Emergency broadcast workflow.
- Role-based access control.
- Audit approval workflow.
- DynamoDB GSIs and geospatial optimization.
- Donor availability calendar.
- Blood compatibility intelligence with medical review constraints.
- Campaign/community module.
- SMS/email/push notifications.
- Monitoring, budget, and security hardening.
- CloudWatch alarms and dashboards.
- Least-privilege IAM per Lambda function.
- WAF/rate limiting/custom authorizer.
- Data retention and audit policy.
- Background jobs for ingestion, matching, and escalation windows.

## 25. Demo Script

1. Landing:
   - Open the app.
   - Explain Hemolytics as AI-powered blood donation coordination for Blood Warriors.
   - Point out workflow and safety principle.
   - Show Estimated Impact Snapshot as coordination metrics, not medical outcomes.

2. Dataset:
   - Open Dataset Ingestion.
   - Explain S3 `Dataset.csv` reload into DynamoDB.
   - Click "Load / Reload Dataset from S3" only if safe for the live demo.
   - Show returned fields: rows loaded, unique users, duplicate groups, data quality flags, donors written, requests written.

3. Dashboard:
   - Open Dashboard.
   - Explain sampled mode for demo speed.
   - Show donor network, data quality, request pipeline, and re-engagement.
   - Point to top eligible donor pool preview.

4. SmartMatch:
   - Open SmartMatch.
   - Configure a blood group and city.
   - Run ranking.
   - Explain hard filters and score factors.
   - Emphasize "coordinator review, not medical approval."

5. AI Outreach:
   - Open AI Outreach.
   - Select donor/request context.
   - Generate a message.
   - Show Priya persona, model/provider details, fallback status if used, copy button, and Mark as Sent.
   - Clarify it does not send WhatsApp automatically.

6. Response Tracking:
   - Enter "Yes, I am available."
   - Show `confirm`, `donor_confirmed`, summary, and next action.
   - Enter "Sorry, I cannot donate today."
   - Show decline/escalation behavior.

7. Impact Story:
   - Open Impact Story.
   - Adjust donors contacted, responses, and potential matches.
   - Generate content.
   - Show awareness message, social post, coordinator summary, safety notice, and Coordination Impact Summary.

8. API Settings:
   - Open API Settings.
   - Show AWS Connected Mode.
   - Show API base URL, endpoints, DynamoDB tables, and architecture.
   - Close with the safety boundary and production roadmap.

## 26. PPT Outline

Slide 1 - Title:

- Hemolytics
- AI-powered blood donation coordination for Blood Warriors
- React + AWS Serverless + Bedrock

Slide 2 - Problem:

- Fragmented donor/request data
- Time pressure for coordinators
- Difficulty prioritizing donors
- Need safe outreach and response tracking

Slide 3 - Solution:

- Dataset intelligence
- SmartMatch donor ranking
- AI Outreach
- Response Tracking
- Impact Story
- Human-led safety boundary

Slide 4 - Architecture:

- React + Vite + Tailwind
- Amplify
- API Gateway
- Lambda
- DynamoDB
- Bedrock
- S3
- CloudWatch

Slide 5 - Dataset Pipeline:

- S3 `Dataset.csv`
- Lambda ingestion
- Cleaning/normalization
- Deduplication by `user_id`
- Request record generation
- DynamoDB writes
- Current load metrics

Slide 6 - SmartMatch:

- Hard filters
- Haversine distance
- Engagement score
- Experience score
- Eligibility/location scores
- Top 5 donor prioritization
- Coordinator review only

Slide 7 - AI Workflow:

- Priya coordinator persona
- Bedrock Claude Haiku
- Safe outreach copy
- Response classification
- Impact story generation
- Safe fallback behavior

Slide 8 - Live Demo Flow:

- Landing
- Dataset
- Dashboard
- SmartMatch
- AI Outreach
- Response Tracking
- Impact Story
- API Settings

Slide 9 - Impact and Safety:

- Records organized
- Requests identified
- Donors prioritized
- Data quality flags surfaced
- No medical approval claims
- No blood safety claims
- No patient PII

Slide 10 - Roadmap:

- WhatsApp Business API
- Notifications
- RBAC
- Audit approvals
- Geospatial optimization
- Donor mobile experience
- Monitoring/security hardening

## 27. Blog/LinkedIn Base Notes

Reusable points for future posts:

- Hemolytics is a serverless AI coordination MVP for blood donation workflows.
- The project focuses on operational coordination, not medical decision-making.
- The frontend is React + Vite + Tailwind, deployed through Amplify.
- The backend is API Gateway + Lambda + DynamoDB + S3 + Bedrock + CloudWatch.
- Dataset ingestion turns messy donor/request rows into DynamoDB profiles and request records.
- SmartMatch ranks donors for coordinator review using blood group, eligibility, activity, location, proximity, engagement, and donation history.
- AI Outreach uses a Priya/Blood Warriors coordinator persona to draft safe messages.
- Response Tracking classifies replies and suggests escalation paths.
- Impact Story creates anonymized awareness content without patient PII or outcome claims.
- The Estimated Impact Snapshot communicates coordination-support metrics safely.
- Bedrock fallback behavior keeps demos resilient even when model access is restricted.
- The architecture avoids RDS, Redis, containers, direct OpenAI/Anthropic APIs, and production WhatsApp complexity for the MVP.
- Future production work should add WhatsApp Business API, RBAC, notifications, audit approvals, GSIs/geospatial optimization, and monitoring.

Possible short LinkedIn framing:

```text
Built Hemolytics, a serverless AI coordination MVP for Blood Warriors. It loads donor/request data from S3, organizes it in DynamoDB, ranks donor profiles through SmartMatch, drafts safe coordinator outreach with AWS Bedrock, classifies donor responses, and creates anonymized awareness content. The key safety boundary: AI assists coordination only; final donor eligibility and blood safety decisions remain human-led.
```

Possible technical article framing:

```text
This case study walks through how Hemolytics uses React, AWS Amplify, API Gateway, Lambda, DynamoDB, S3, Bedrock, and CloudWatch to create a practical blood donation coordination workflow. The article can cover dataset ingestion, DynamoDB modeling, SmartMatch ranking, Bedrock fallback design, safety boundaries, and production roadmap.
```

## 28. Final Submission Summary

Project description:

Hemolytics is an AI-powered blood donation coordination platform for Blood Warriors. It helps coordinators organize donor/request data, understand dataset readiness, prioritize donor outreach, draft safe messages, classify responses, suggest escalation actions, and create anonymized awareness content.

Live links:

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

Tech stack:

- React
- Vite
- TypeScript source files
- Tailwind CSS
- AWS Amplify
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- AWS Bedrock Claude Haiku
- Amazon CloudWatch
- AWS SAM / CloudFormation

Key features:

- Landing page for first-time users and judges.
- Dataset ingestion from S3 into DynamoDB.
- Dashboard for sampled donor/request analytics.
- SmartMatch donor prioritization.
- AI Outreach message generation.
- Response Tracking and escalation suggestions.
- Impact Story and awareness generation.
- API Settings / AWS visibility.
- Estimated Impact Snapshot with safe coordination metrics.
- Responsive desktop/mobile app shell.

Safety note:

Hemolytics does not certify donor health, donor eligibility, or blood safety. It does not make medical decisions and does not claim completed donations or saved lives. It assists coordinators with prioritization, outreach, response understanding, escalation, and awareness messaging. Final decisions remain with authorized human coordinators and medical staff.

Roadmap:

- WhatsApp Business API integration.
- Patient/coordinator notifications.
- Donor mobile experience.
- Emergency broadcast workflow.
- Role-based access control.
- Audit approval workflow.
- DynamoDB GSI/geospatial optimization.
- Donor availability calendar.
- Blood compatibility intelligence with medical oversight.
- Campaign/community module.
- SMS/email/push notifications.
- Monitoring, budget, and security hardening.

