# Hemolytics — API Documentation

## 1. API Overview

Hemolytics exposes a serverless REST-style API through Amazon API Gateway, with each route backed by an AWS Lambda handler in `backend/handlers/`. The API supports the hackathon MVP workflow for Blood Warriors-style blood donation coordination:

- health and deployment status checks
- dashboard intelligence from DynamoDB donor/request data
- S3-backed dataset ingestion into DynamoDB
- SmartMatch donor ranking
- AI Outreach message generation through AWS Bedrock with safe fallback behavior
- donor response classification and escalation support
- anonymized Impact Story generation through AWS Bedrock with safe fallback behavior

This is a working hackathon MVP API. It is not a production-certified healthcare API, blood bank system, emergency dispatch system, or medical eligibility system.

## 2. Base URL

Deployed API base URL:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

The frontend connects to this API by setting:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Frontend calls are centralized in:

```text
src/services/api.ts
```

Endpoint paths are configured in:

```text
src/config/apiConfig.ts
```

When `VITE_API_BASE_URL` is set, the frontend runs in AWS Connected Mode. When it is absent, `src/services/api.ts` returns mock/demo responses for local presentation safety.

## 3. API Architecture

Hemolytics keeps the browser, frontend service layer, API Gateway, Lambda handlers, and backend services separated.

```text
User Browser
  |
  v
AWS Amplify hosted React app
  |
  v
src/services/api.ts
  |
  v
Amazon API Gateway
  |
  v
Lambda handler in backend/handlers/
  |
  v
Backend service module in backend/services/
  |
  +--> DynamoDB: donors, requests, responses, conversations
  +--> S3: Dataset.csv loading
  +--> AWS Bedrock: Claude message/story generation
  +--> CloudWatch: Lambda logs and diagnostics
  |
  v
JSON response consumed by frontend page
```

The API is deployed separately from the frontend through AWS SAM and CloudFormation. Amplify hosts the React frontend only.

## 4. Common Response Pattern

All Lambda handlers use API Gateway Lambda proxy-style responses through `backend/services/common.py`.

The raw Lambda response shape is:

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  },
  "body": "{\"example\":\"value\"}"
}
```

When called through API Gateway from the frontend, the browser receives the parsed HTTP response body as JSON.

Success responses use:

```python
ok(payload)
```

which produces HTTP `200` with a JSON body.

Bad request responses use:

```python
bad_request(message, details=None)
```

Example body:

```json
{
  "status": "error",
  "error": "requiredBloodGroup is required."
}
```

Server error responses use:

```python
server_error(message, details=None)
```

Example body:

```json
{
  "status": "error",
  "error": "SmartMatch failed.",
  "details": "..."
}
```

`decimal_to_float_safe()` converts DynamoDB `Decimal` values into JSON-safe integers/floats before serialization. Datetime/date values are serialized as ISO strings.

All handlers also support `OPTIONS` preflight through `handle_options(event)`, returning:

```json
{
  "status": "ok"
}
```

## 5. Error Handling Model

Invalid JSON bodies are caught by `parse_json_body(event)` and returned as HTTP `400`.

Missing required fields are handled in the individual handlers:

- `/match` requires `requiredBloodGroup` or `required_blood_group`, plus `latitude` and `longitude`.
- `/chat` requires both `donor` and `request`.
- `/response` requires `requestId` or `request_id`, and `donorId` or `donor_id`.

Unexpected backend exceptions are returned as HTTP `500` through `server_error(...)`.

The frontend wrapper in `src/services/api.ts` uses `fetch`. If `res.ok` is false, it reads the response text and throws:

```ts
new Error(`API error ${res.status}: ${text}`)
```

Pages then display visible error states. For example, Dataset Ingestion shows an error panel with retry, Dashboard shows a load failure state, and Impact Story shows a visible error card.

AWS Bedrock failures are handled differently from general failures. `backend/services/bedrock_service.py` catches model invocation errors inside AI generation functions and returns safe fallback content with:

```json
{
  "bedrock_available": false,
  "fallback_used": true,
  "bedrock_error_type": "AccessDeniedException"
}
```

The API does not log prompts, donor private details, credentials, or secrets intentionally. Bedrock logs include safe operational context such as model id, region, operation name, and exception type so deployment issues can be diagnosed in CloudWatch.

## 6. Endpoint Summary Table

| Method | Path | Purpose | Handler file | Main frontend page | AWS/data dependencies | Fallback behavior |
|---|---|---|---|---|---|---|
| GET | `/health` | Health/status check | `backend/handlers/health.py` | API Settings / deployment checks | Environment variables | None required |
| GET | `/dashboard` | Sampled donor/request analytics | `backend/handlers/dashboard.py` | `src/pages/Dashboard.tsx` | DynamoDB donors and requests | Frontend mock if no API base URL |
| POST | `/load-dataset` | Load `Dataset.csv` from S3 or provided rows into DynamoDB | `backend/handlers/load_dataset.py` | `src/pages/DatasetIngestion.tsx` | S3, DynamoDB donors/requests | Frontend mock if no API base URL |
| POST | `/match` | Rank top donor candidates | `backend/handlers/match.py` | `src/pages/SmartMatch.tsx` | DynamoDB donors, scoring service | Frontend mock if no API base URL |
| POST | `/chat` | Generate coordinator-ready outreach copy | `backend/handlers/chat.py` | `src/pages/AiOutreach.tsx` | Bedrock, DynamoDB conversations | Safe Bedrock fallback message |
| POST | `/response` | Classify donor response and update request status | `backend/handlers/response.py` | `src/pages/ResponseTracking.tsx` | DynamoDB responses/requests | Frontend mock if no API base URL |
| POST | `/impact-story` | Generate anonymized awareness content | `backend/handlers/impact_story.py` | `src/pages/ImpactStory.tsx` | Bedrock | Safe Bedrock fallback content |

## 7. GET /health

Purpose: confirm that the deployed API is reachable and returning the expected Hemolytics metadata.

Handler:

```text
backend/handlers/health.py
```

Input: no request body.

Output fields returned by the handler:

- `status`
- `app`
- `version`
- `architecture`
- `region`
- `safety`

Example:

```bash
curl -X GET "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/health"
```

Example response:

```json
{
  "status": "healthy",
  "app": "Hemolytics",
  "version": "1.0.0",
  "architecture": "API Gateway + Lambda + DynamoDB + Bedrock + S3 + CloudWatch",
  "region": "us-east-1",
  "safety": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans."
}
```

Frontend usage: the API Settings page can use health/status information for deployment confidence. The script `backend/scripts/test_api_endpoints.py` also checks this endpoint.

Operational use: run this first after SAM deployment or Amplify environment configuration to confirm API Gateway, Lambda, routing, and CORS are functioning.

Failure behavior: if the API Gateway stage, Lambda deployment, or CORS setup is broken, this route may fail before app-specific business logic is involved.

## 8. GET /dashboard

Purpose: return fast dashboard intelligence from DynamoDB donor/request records.

Handler:

```text
backend/handlers/dashboard.py
```

Backend services used:

- `backend/services/dynamodb_service.py`
- `backend/services/common.py`

DynamoDB dependencies:

- `HemolyticsDonors`
- `HemolyticsRequests`

The dashboard uses sampled analytics for demo-speed performance. The handler reads a limited donor sample using `DASHBOARD_SCAN_LIMIT` with a default of `1000`, and a limited request sample using `DASHBOARD_REQUEST_SCAN_LIMIT` with a default of `500`.

The handler uses projection expressions for the dashboard fields when possible, then falls back to a normal limited scan if projection fails. This avoids the deployed dashboard timeout that can happen when processing the entire dataset synchronously.

Known response fields:

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

Example:

```bash
curl -X GET "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/dashboard"
```

Example response shape:

```json
{
  "totalRecords": 1000,
  "uniqueUsers": 1000,
  "totalDonorLikeUsers": 905,
  "activeDonors": 905,
  "inactiveDonors": 95,
  "eligibleDonors": 870,
  "notEligibleDonors": 130,
  "missingBloodGroup": 210,
  "missingLocation": 4,
  "locationCoveragePercent": 99.6,
  "reengagementCandidates": 45,
  "activeBridgeCount": 500,
  "bloodGroupDistribution": [
    { "group": "O Positive", "count": 220 }
  ],
  "roleDistribution": [
    { "role": "donor", "count": 905 }
  ],
  "topEligibleDonorPool": [
    {
      "user_id": "DONOR-SAMPLE-001",
      "blood_group": "O Positive",
      "eligibility_status": "eligible",
      "user_donation_active_status": "Active",
      "has_valid_blood_group": true,
      "has_valid_location": true
    }
  ],
  "recentActivity": [
    {
      "time": "now",
      "event": "Dashboard sampled 1000 donors and 500 requests",
      "type": "system"
    }
  ],
  "sampledRecords": 1000,
  "dashboardMode": "sampled"
}
```

The numeric values above illustrate the response shape. Live values depend on the sampled records in DynamoDB.

Frontend page:

```text
src/pages/Dashboard.tsx
```

Safety note: dashboard analytics are coordination-support indicators and may use sampled records for demo-speed performance. They are not confirmed medical outcomes, donation completions, or blood safety guarantees.

Failure behavior: DynamoDB read errors return HTTP `500` with `Unable to read dashboard data from DynamoDB.`

## 9. POST /load-dataset

Purpose: load the Blood Warriors dataset from S3 or provided rows, clean and normalize records, deduplicate donor profiles, generate request records, and write to DynamoDB.

Handler:

```text
backend/handlers/load_dataset.py
```

Service:

```text
backend/services/dataset_service.py
```

Storage dependencies:

- S3 bucket configured by `S3_DATASET_BUCKET`
- S3 key configured by `S3_DATASET_KEY`
- `HemolyticsDonors`
- `HemolyticsRequests`

No body is required when loading the deployed S3 dataset:

```json
{}
```

The service also supports a body with inline rows for local/testing use:

```json
{
  "rows": [
    {
      "user_id": "DONOR-SAMPLE-001",
      "blood_group": "O Positive",
      "latitude": "12.9716",
      "longitude": "77.5946",
      "eligibility_status": "eligible",
      "user_donation_active_status": "Active"
    }
  ]
}
```

Dataset pipeline behavior visible in code:

- loads CSV rows from S3 when `rows` is not provided
- cleans known Blood Warriors dataset fields
- normalizes blood group, dates, coordinates, active status, and eligibility status
- derives scoring fields such as `has_valid_blood_group`, `has_valid_location`, `is_match_eligible`, `donor_experience_score`, `engagement_score`, `eligibility_score`, `location_quality_score`, `reengagement_priority`, and `bridge_request_candidate`
- deduplicates donor profiles by `user_id`, keeping the most complete donor profile
- generates unique request records for bridge/request candidates
- writes donor profiles to `HemolyticsDonors`
- writes request records to `HemolyticsRequests`
- batch writes safely with primary-key deduplication

Known loaded metrics from the current deployed dataset:

- `7033` rows loaded
- `6946` unique users created
- `87` duplicate user groups handled
- `2036` invalid/unknown blood groups flagged
- `24` missing locations flagged
- `6946` donor records written
- `786` request records written

Example:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/load-dataset" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Example response:

```json
{
  "rowsLoaded": 7033,
  "cleanedRows": 7033,
  "uniqueUsersCreated": 6946,
  "duplicateGroupsHandled": 87,
  "duplicate_user_ids_detected": 87,
  "donor_deduplication_applied": true,
  "invalidBloodGroupsFlagged": 2036,
  "missingLocationFlagged": 24,
  "donorsWrittenToHemolyticsDonors": 6946,
  "requestsWrittenToHemolyticsRequests": 786,
  "loadStatus": "completed",
  "timestamp": "2026-06-06T22:44:32.539516+00:00"
}
```

Frontend page:

```text
src/pages/DatasetIngestion.tsx
```

The browser does not upload CSV files directly to S3 in the current MVP. The Dataset Ingestion page triggers backend reload from the already uploaded `Dataset.csv` in S3.

Repeated-load behavior: the current service writes records by DynamoDB primary key. Donor records use `user_id`; request records use generated unique `request_id` values when needed. Re-running ingestion refreshes/re-writes matching keys rather than appending duplicate donor primary keys.

Failure behavior:

- invalid request body returns HTTP `400`
- missing S3 bucket/key configuration returns HTTP `400` through `ValueError`
- unexpected S3/DynamoDB errors return HTTP `500`

Raw dataset contents are intentionally not included in this documentation.

## 10. POST /match

Purpose: rank the top donor candidates for coordinator review.

Handler:

```text
backend/handlers/match.py
```

Scoring service:

```text
backend/services/scoring_service.py
```

Expected input fields supported by code:

- `requestId` or `request_id`
- `requiredBloodGroup` or `required_blood_group`
- `latitude`
- `longitude`
- `city`
- `urgency`
- `quantityRequired` or `quantity_required`
- `neededBy` or `needed_by`

Required fields:

- `requiredBloodGroup` or `required_blood_group`
- `latitude`
- `longitude`

Candidate retrieval: the handler reads donor records from DynamoDB through `get_donors()` and ranks them in memory for the MVP.

Matching behavior:

- blood group uses exact normalized match
- donor blood group must exist and must not be `Do not Know`
- donor `eligibility_status` must be `eligible`
- donor `user_donation_active_status` must be `Active` for strict matches
- donor coordinates must be valid
- if fewer than five strict donors are found, active status may be relaxed for backup candidates, but missing blood group, invalid location, and non-eligible donors are still excluded

Scoring factors:

- proximity score
- engagement score
- donor experience score
- eligibility score
- location quality score

Current weights in `scoring_service.py`:

- proximity: `0.30`
- engagement: `0.25`
- experience: `0.15`
- eligibility: `0.15`
- location quality: `0.15`

Example request:

```json
{
  "requestId": "REQ-DEMO-001",
  "requiredBloodGroup": "O Positive",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "city": "Bengaluru",
  "urgency": "High",
  "quantityRequired": 1,
  "neededBy": "2026-06-30"
}
```

Example:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/match" \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"REQ-DEMO-001\",\"requiredBloodGroup\":\"O Positive\",\"latitude\":12.9716,\"longitude\":77.5946,\"city\":\"Bengaluru\",\"urgency\":\"High\",\"quantityRequired\":1}"
```

Example response shape:

```json
{
  "results": [
    {
      "rank": 1,
      "donor_id": "DONOR-SAMPLE-001",
      "user_id": "DONOR-SAMPLE-001",
      "blood_group": "O Positive",
      "distance_km": 8.4,
      "eligibility_status": "eligible",
      "active_status": "Active",
      "donations_till_date": 4,
      "total_calls": 6,
      "calls_to_donations_ratio": 1.5,
      "donor_type": "regular",
      "score": 88,
      "match_score": 88,
      "confidence_label": "High",
      "reason_for_ranking": "Matched O Positive, eligible, Active, 8.4 km away, 4 prior donations, strong engagement score.",
      "reason": "Matched O Positive, eligible, Active, 8.4 km away, 4 prior donations, strong engagement score.",
      "recommended_action": "Prioritized for coordinator review; verify availability, logistics, and eligibility through human process."
    }
  ],
  "matchTimeMs": 134,
  "totalCandidates": 6946,
  "eligibleCandidates": 4100
}
```

The example uses safe sample donor IDs, not real private donor information.

No-result behavior: if no candidates pass filters, `results` is an empty array. The frontend displays that state as no current ranked matches.

Frontend page:

```text
src/pages/SmartMatch.tsx
```

Safety boundary: SmartMatch ranks donors to contact first. It does not guarantee donor availability, medical eligibility, donation completion, or blood safety.

## 11. POST /chat

Purpose: generate coordinator-ready donor outreach copy.

Handler:

```text
backend/handlers/chat.py
```

AI service:

```text
backend/services/bedrock_service.py
```

Storage dependency:

- `HemolyticsConversations`

Expected input shape:

```json
{
  "donor": {
    "user_id": "DONOR-SAMPLE-001",
    "name": "Asha",
    "blood_group": "O Positive"
  },
  "request": {
    "request_id": "REQ-DEMO-001",
    "requiredBloodGroup": "O Positive",
    "city": "Bengaluru",
    "urgency": "High"
  },
  "tone": "WhatsApp-style",
  "language": "English"
}
```

`donor` and `request` are required. `tone` defaults to `WhatsApp-style`; `language` defaults to `English`.

Example:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/chat" \
  -H "Content-Type: application/json" \
  -d "{\"donor\":{\"user_id\":\"DONOR-SAMPLE-001\",\"name\":\"Asha\",\"blood_group\":\"O Positive\"},\"request\":{\"request_id\":\"REQ-DEMO-001\",\"requiredBloodGroup\":\"O Positive\",\"city\":\"Bengaluru\",\"urgency\":\"High\"},\"tone\":\"WhatsApp-style\",\"language\":\"English\"}"
```

Example success response:

```json
{
  "message": "Hi Asha, this is Priya from Blood Warriors. We have an O Positive request in Bengaluru. Are you available to speak with a coordinator today? Final eligibility and safety checks will be handled by authorized staff.",
  "model": "anthropic.claude-3-5-haiku-20241022-v1:0",
  "provider": "AWS Bedrock",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "bedrock_available": true,
  "fallback_used": false,
  "conversationId": "CONV-20260624T120000Z"
}
```

Example fallback response:

```json
{
  "message": "Hi Asha, this is Priya from Blood Warriors. We have a request for O Positive in Bengaluru. Are you available to speak with a coordinator today? Final eligibility and blood safety checks will be handled by authorized staff.",
  "model": "anthropic.claude-3-5-haiku-20241022-v1:0",
  "provider": "AWS Bedrock",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "bedrock_available": false,
  "fallback_used": true,
  "bedrock_error_type": "AccessDeniedException",
  "conversationId": "CONV-20260624T120000Z"
}
```

The exact `conversationId` is generated by the DynamoDB service.

Frontend page:

```text
src/pages/AiOutreach.tsx
```

Important boundary: this endpoint generates coordinator-ready message text. It does not send WhatsApp messages, SMS messages, email, or notifications automatically. The frontend copy/mark-as-sent workflow is a local coordinator workflow aid, not a production WhatsApp integration.

Safety behavior:

- no medical approval
- no blood safety certification
- no guaranteed outcome
- no patient PII
- final verification remains human-led

## 12. POST /response

Purpose: classify donor replies, suggest next coordinator action, store the response, and update the request status when possible.

Handler:

```text
backend/handlers/response.py
```

Service:

```text
backend/services/response_service.py
```

DynamoDB dependencies:

- `HemolyticsResponses`
- `HemolyticsRequests`

Expected input shape:

```json
{
  "requestId": "REQ-DEMO-001",
  "donorId": "DONOR-SAMPLE-001",
  "responseText": "Yes, I am available",
  "currentRank": 1,
  "rankedDonors": [
    { "donor_id": "DONOR-SAMPLE-001" },
    { "donor_id": "DONOR-SAMPLE-002" }
  ]
}
```

Required fields:

- `requestId` or `request_id`
- `donorId` or `donor_id`

Classification categories implemented in code:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Intent examples:

| Input text | Detected intent | Response status | Escalation |
|---|---|---|---|
| `Yes, I am available` | `confirm` | `donor_confirmed` | `false` |
| `Sorry, I cannot donate today` | `decline` | `escalated` if a next donor exists | `true` if next donor exists |
| `Can I come tomorrow?` | `reschedule` | `needs_follow_up` | `false` |
| empty string / `timeout` / `no response` | `no_response` | `escalated` if a next donor exists | `true` if next donor exists |

Example confirm request:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/response" \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"REQ-DEMO-001\",\"donorId\":\"DONOR-SAMPLE-001\",\"responseText\":\"Yes, I am available\",\"currentRank\":1,\"rankedDonors\":[{\"donor_id\":\"DONOR-SAMPLE-001\"},{\"donor_id\":\"DONOR-SAMPLE-002\"}]}"
```

Example confirm response:

```json
{
  "detectedIntent": "confirm",
  "responseStatus": "donor_confirmed",
  "aiSummary": "Donor appears available. Coordinator must verify availability, logistics, and eligibility through the normal human process.",
  "nextAction": "Call donor and continue coordinator-managed eligibility and logistics checks.",
  "escalationTriggered": false,
  "nextDonorId": null,
  "updatedRequestStatus": "donor_confirmed"
}
```

Example decline request:

```json
{
  "requestId": "REQ-DEMO-001",
  "donorId": "DONOR-SAMPLE-001",
  "responseText": "Sorry, I cannot donate today",
  "currentRank": 1,
  "rankedDonors": [
    { "donor_id": "DONOR-SAMPLE-001" },
    { "donor_id": "DONOR-SAMPLE-002" }
  ]
}
```

Example decline response:

```json
{
  "detectedIntent": "decline",
  "responseStatus": "escalated",
  "aiSummary": "Donor declined or appears unavailable. Escalate to the next ranked donor if the request remains open.",
  "nextAction": "Escalate to the next ranked donor and keep the request open.",
  "escalationTriggered": true,
  "nextDonorId": "DONOR-SAMPLE-002",
  "updatedRequestStatus": "escalated"
}
```

Example reschedule request:

```json
{
  "requestId": "REQ-DEMO-001",
  "donorId": "DONOR-SAMPLE-001",
  "responseText": "Can I come tomorrow?",
  "currentRank": 1,
  "rankedDonors": [
    { "donor_id": "DONOR-SAMPLE-001" },
    { "donor_id": "DONOR-SAMPLE-002" }
  ]
}
```

Example reschedule response:

```json
{
  "detectedIntent": "reschedule",
  "responseStatus": "needs_follow_up",
  "aiSummary": "Donor may be available at another time. Coordinator follow-up is needed.",
  "nextAction": "Create a coordinator follow-up and keep backup donors available.",
  "escalationTriggered": false,
  "nextDonorId": null,
  "updatedRequestStatus": "needs_follow_up"
}
```

Example no-response request:

```json
{
  "requestId": "REQ-DEMO-001",
  "donorId": "DONOR-SAMPLE-001",
  "responseText": "",
  "currentRank": 1,
  "rankedDonors": [
    { "donor_id": "DONOR-SAMPLE-001" },
    { "donor_id": "DONOR-SAMPLE-002" }
  ]
}
```

Frontend page:

```text
src/pages/ResponseTracking.tsx
```

Safety boundary: the response classifier assists coordinator follow-up. It does not medically approve donors, certify donor eligibility, confirm donation completion, or certify blood safety.

## 13. POST /impact-story

Purpose: generate anonymized awareness content and coordinator summaries from safe campaign-level metrics.

Handler:

```text
backend/handlers/impact_story.py
```

AI service:

```text
backend/services/bedrock_service.py
```

Expected input shape:

```json
{
  "donorsContacted": 25,
  "responsesReceived": 12,
  "potentialMatches": 5,
  "campaignCity": "Bengaluru",
  "bloodGroup": "O Positive",
  "patientSafeContext": "Urgent request coordination for a thalassemia care workflow.",
  "tone": "Hopeful and factual"
}
```

Example:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/impact-story" \
  -H "Content-Type: application/json" \
  -d "{\"donorsContacted\":25,\"responsesReceived\":12,\"potentialMatches\":5,\"campaignCity\":\"Bengaluru\",\"bloodGroup\":\"O Positive\",\"patientSafeContext\":\"Urgent request coordination for a thalassemia care workflow.\",\"tone\":\"Hopeful and factual\"}"
```

Example response:

```json
{
  "awarenessMessage": "In Bengaluru, an O Positive donor outreach effort contacted 25 community members, with 12 responses and 5 potential matches for coordinator review. All details are anonymized.",
  "socialPost": "Bengaluru blood donation update: 25 contacted, 12 responses, 5 potential matches for coordinator review. No medical claims, no patient PII.",
  "coordinatorSummary": "Campaign city: Bengaluru. Blood group focus: O Positive. Donors contacted: 25. Responses received: 12. Potential matches: 5. Content anonymized.",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "model": "anthropic.claude-3-5-haiku-20241022-v1:0",
  "provider": "AWS Bedrock",
  "bedrock_available": true,
  "fallback_used": false
}
```

Example fallback response:

```json
{
  "awarenessMessage": "In Bengaluru, a O Positive donor outreach effort contacted 25 community members, with 12 responses and 5 potential matches for coordinator review. All details are anonymized.",
  "socialPost": "Bengaluru blood donation update: 25 contacted, 12 responses, 5 potential matches for coordinator review. No medical claims, no patient PII.",
  "coordinatorSummary": "Campaign city: Bengaluru. Blood group focus: O Positive. Donors contacted: 25. Responses received: 12. Potential matches: 5. Content anonymized.",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "bedrock_available": false,
  "fallback_used": true,
  "bedrock_error_type": "ResourceNotFoundException"
}
```

Frontend page:

```text
src/pages/ImpactStory.tsx
```

Safety boundaries:

- no patient PII
- no confirmed lives-saved claims
- no medical outcome claims
- no blood safety certification
- impact metrics are coordination-support indicators unless verified outcome data exists

## 14. Frontend API Service Layer

The frontend API layer is implemented in:

```text
src/services/api.ts
```

Configuration lives in:

```text
src/config/apiConfig.ts
```

Key frontend behavior:

- `API_BASE_URL` reads `import.meta.env.VITE_API_BASE_URL`
- `IS_AWS_CONNECTED` is true when `API_BASE_URL.length > 0`
- `apiFetch<T>()` builds the request URL as `${API_BASE_URL}${path}`
- requests use `Content-Type: application/json`
- request bodies are JSON-stringified when provided
- non-2xx responses throw an `Error`
- successful responses call `res.json()`
- when not connected to AWS, mock responses keep the demo usable

Frontend function mapping:

| Frontend function | Endpoint | Page | Purpose |
|---|---|---|---|
| `getHealth()` | `GET /health` | API Settings / diagnostics | Health check |
| `getDashboard()` | `GET /dashboard` | Dashboard | Dashboard metrics |
| `loadDataset()` | `POST /load-dataset` | Dataset Ingestion | Reload S3 dataset into DynamoDB |
| `runSmartMatch(request)` | `POST /match` | SmartMatch | Rank donor candidates |
| `generateOutreachMessage(context)` | `POST /chat` | AI Outreach | Generate coordinator-ready message |
| `submitDonorResponse(payload)` | `POST /response` | Response Tracking | Classify reply and show next action |
| `generateImpactStory(payload)` | `POST /impact-story` | Impact Story | Generate anonymized awareness content |

## 15. Backend Handler-to-Service Mapping

| Endpoint | Handler file | Service modules | AWS service touched | DynamoDB table touched | Frontend consumer |
|---|---|---|---|---|---|
| `GET /health` | `backend/handlers/health.py` | `services.common` | CloudWatch logs | None | API Settings / scripts |
| `GET /dashboard` | `backend/handlers/dashboard.py` | `services.dynamodb_service`, `services.common` | DynamoDB, CloudWatch | Donors, Requests | Dashboard |
| `POST /load-dataset` | `backend/handlers/load_dataset.py` | `services.dataset_service`, `services.dynamodb_service`, `services.common` | S3, DynamoDB, CloudWatch | Donors, Requests | Dataset Ingestion |
| `POST /match` | `backend/handlers/match.py` | `services.scoring_service`, `services.dynamodb_service`, `services.common` | DynamoDB, CloudWatch | Donors | SmartMatch |
| `POST /chat` | `backend/handlers/chat.py` | `services.bedrock_service`, `services.dynamodb_service`, `services.common` | Bedrock, DynamoDB, CloudWatch | Conversations | AI Outreach |
| `POST /response` | `backend/handlers/response.py` | `services.response_service`, `services.dynamodb_service`, `services.common` | DynamoDB, CloudWatch | Responses, Requests | Response Tracking |
| `POST /impact-story` | `backend/handlers/impact_story.py` | `services.bedrock_service`, `services.common` | Bedrock, CloudWatch | None | Impact Story |

## 16. Data and Storage Dependencies

S3:

- `Dataset.csv` is stored in the configured dataset bucket.
- `POST /load-dataset` reads from S3 when no inline `rows` array is supplied.

DynamoDB:

- `HemolyticsDonors`: donor/user profiles used by Dashboard and SmartMatch.
- `HemolyticsRequests`: bridge/request candidates used by Dashboard and updated by Response Tracking.
- `HemolyticsResponses`: stored response classification records.
- `HemolyticsConversations`: stored AI Outreach conversation records.

Bedrock:

- `/chat` and `/impact-story` call AWS Bedrock Runtime through `boto3`.
- The backend uses Claude-compatible Bedrock request formatting.
- Safe fallback output is returned when model access, region, permissions, or invocation fails.

CloudWatch:

- Lambda execution logs.
- Safe Bedrock invocation diagnostics.
- SAM/API Gateway/Lambda operational debugging.

No AWS credentials, secrets, or raw dataset contents are exposed through this documentation.

## 17. Authentication and Authorization Status

The current MVP API does not implement production authentication or role-based access control in the application layer.

Based on the inspected SAM template and backend handlers:

- API Gateway routes are public MVP routes.
- There is no frontend login flow.
- There is no JWT validation in handlers.
- There is no coordinator role model yet.

This is an explicit hackathon MVP limitation. Production use would require authentication, role-based access control, audit logging, tighter CORS/origin controls, least-privilege IAM review, and privacy/security review. These items belong to the future production roadmap in `docs/FUTURE_ENHANCEMENTS.md`.

## 18. CORS and Browser Access

CORS is needed because the Amplify-hosted React frontend calls the API Gateway domain from a browser.

`backend/services/common.py` returns these headers for all standard responses:

```json
{
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}
```

The handlers also support `OPTIONS` preflight through `handle_options(event)`.

Common browser/API symptoms:

- missing `VITE_API_BASE_URL`: frontend runs in Mock Mode instead of AWS Connected Mode
- wrong API URL: frontend fetch calls fail with network/API errors
- missing CORS headers: browser blocks the response even if Lambda executed
- API Gateway/Lambda error: frontend receives an `API error <status>` message from `apiFetch`

## 19. API Safety Boundaries

The Hemolytics API does not:

- certify donor health
- certify donor medical eligibility
- certify blood safety
- guarantee donor availability
- complete donations
- send WhatsApp messages automatically
- replace coordinators
- replace authorized medical staff
- intentionally expose patient PII
- claim confirmed lives saved

The Hemolytics API does:

- organize donor and request data
- rank potential donor contacts for coordinator review
- generate safe coordinator-ready outreach text
- classify donor replies
- suggest follow-up or escalation actions
- generate anonymized awareness content
- provide coordination-support metrics

All medical eligibility, blood safety, final donor approval, and operational decisions remain with authorized humans and established medical/blood bank processes.

## 20. Local Testing and Verification

Existing backend helper scripts:

```text
backend/scripts/test_api_endpoints.py
backend/scripts/run_local_handler.py
```

Existing local event files are stored under:

```text
backend/events/
```

`run_local_handler.py` dynamically imports a handler module and calls `lambda_handler(event, None)`.

Example local handler command:

```bash
python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json
```

`test_api_endpoints.py` tests the deployed API base URL at a high level.

Example deployed API test command:

```bash
python backend/scripts/test_api_endpoints.py https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Manual verification checklist:

- `/health` returns `status: healthy`
- `/dashboard` loads without timeout and returns `dashboardMode: sampled`
- `/load-dataset` returns dataset load metrics
- `/match` returns ranked donors or an empty `results` array
- `/chat` returns Bedrock output or safe fallback message
- `/response` classifies replies into implemented intent categories
- `/impact-story` returns generated or fallback awareness content

## 21. Example End-to-End API Flow

Typical demo/API journey:

1. `POST /load-dataset`
   - loads `Dataset.csv` from S3 into DynamoDB
   - creates donor profiles and request records

2. `GET /dashboard`
   - reads sampled DynamoDB records
   - returns coordination and data quality metrics

3. `POST /match`
   - accepts a request context
   - ranks top donor candidates for coordinator review

4. `POST /chat`
   - accepts donor and request context
   - generates a coordinator-ready outreach message

5. `POST /response`
   - accepts a donor reply
   - classifies intent and suggests next action/escalation

6. `POST /impact-story`
   - accepts safe campaign-level metrics
   - generates anonymized awareness content

This maps to the user-facing frontend flow:

```text
Dataset Ingestion -> Dashboard -> SmartMatch -> AI Outreach -> Response Tracking -> Impact Story
```

## 22. Current API Limitations

Current MVP limitations:

- no production auth/RBAC yet
- dashboard uses sampled analytics for speed
- SmartMatch uses scan/ranking logic rather than production indexed/geospatial querying
- no real WhatsApp sending
- no donor availability calendar API
- no full request lifecycle API
- no coordinator assignment API
- no background job scheduler or queue-based escalation worker
- no production notification events
- Bedrock fallback may be used depending on AWS account model access and permissions
- no production healthcare compliance certification
- CORS is permissive for hackathon deployment

These limitations are appropriate for a hackathon MVP but must be addressed before real production use.

## 23. Future API Roadmap

The full future roadmap is documented in:

```text
docs/FUTURE_ENHANCEMENTS.md
```

Future API areas include:

- coordinator assignment APIs
- request lifecycle APIs
- donor availability APIs
- notification event APIs
- WhatsApp Business API webhook handling
- SMS/email delivery event handling
- audit log APIs
- campaign management APIs
- analytics APIs
- authentication and RBAC APIs
- consent and communication preference APIs
- optimized matching APIs using DynamoDB GSIs/geospatial indexing

These are future enhancements. They are not part of the current deployed hackathon API unless explicitly implemented in the repo.

## 24. API Documentation Summary

The Hemolytics API is a working serverless MVP API that connects dataset ingestion, dashboard intelligence, donor ranking, AI-assisted outreach, response tracking, and safe impact storytelling.

The API is designed as coordinator decision support. It organizes data, prioritizes potential contacts, drafts safe outreach text, classifies replies, and creates anonymized awareness content. It must not be interpreted as a medical certification system, blood safety system, or guaranteed donation fulfillment system.

The current API is strong enough for hackathon demonstration, GitHub review, technical storytelling, and future architecture planning. Production deployment would require authentication, access control, auditability, stronger privacy controls, optimized data access patterns, communication integrations, and formal medical/operational governance.
