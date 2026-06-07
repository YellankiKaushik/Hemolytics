# Hemolytics API Documentation

## Base URL

Production backend:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Frontend environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

## Response Format

Backend handlers return API Gateway Lambda proxy responses:

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

The frontend receives the parsed JSON body through `src/services/api.ts`.

## CORS and OPTIONS

All handlers support safe `OPTIONS` preflight behavior through `backend/services/common.py`.

## Endpoints

| Method | Path | Handler | Frontend service |
| --- | --- | --- | --- |
| GET | `/health` | `handlers.health.lambda_handler` | `getHealth()` |
| GET | `/dashboard` | `handlers.dashboard.lambda_handler` | `getDashboard()` |
| POST | `/load-dataset` | `handlers.load_dataset.lambda_handler` | `loadDataset()` |
| POST | `/match` | `handlers.match.lambda_handler` | `runSmartMatch()` |
| POST | `/chat` | `handlers.chat.lambda_handler` | `generateOutreachMessage()` |
| POST | `/response` | `handlers.response.lambda_handler` | `submitDonorResponse()` |
| POST | `/impact-story` | `handlers.impact_story.lambda_handler` | `generateImpactStory()` |

## GET /health

Purpose: verify API availability and return architecture metadata.

Example response body:

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

## GET /dashboard

Purpose: return sampled dashboard metrics for demo-speed analytics.

Response fields include:

```json
{
  "totalRecords": 1000,
  "uniqueUsers": 1000,
  "totalDonorLikeUsers": 900,
  "activeDonors": 500,
  "inactiveDonors": 400,
  "eligibleDonors": 300,
  "notEligibleDonors": 600,
  "missingBloodGroup": 200,
  "missingLocation": 24,
  "locationCoveragePercent": 97.6,
  "reengagementCandidates": 100,
  "activeBridgeCount": 50,
  "bloodGroupDistribution": [],
  "roleDistribution": [],
  "topEligibleDonorPool": [],
  "recentActivity": [],
  "sampledRecords": 1000,
  "dashboardMode": "sampled"
}
```

Implementation note: the handler uses limited scans and projection expressions to avoid Lambda timeouts on the real dataset.

## POST /load-dataset

Purpose: load donor/request data from S3 or from request-provided rows.

Request body options:

```json
{}
```

or:

```json
{
  "rows": [
    {
      "user_id": "USER-001",
      "blood_group": "O Positive",
      "latitude": 17.385,
      "longitude": 78.4867
    }
  ]
}
```

Response body:

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

## POST /match

Purpose: return top donor matches for coordinator review.

Request body:

```json
{
  "requestId": "REQ-001",
  "requiredBloodGroup": "O Positive",
  "latitude": 17.385,
  "longitude": 78.4867,
  "city": "Hyderabad",
  "urgency": "Critical",
  "quantityRequired": 1,
  "neededBy": "2026-06-07T10:00"
}
```

Response body:

```json
{
  "requestId": "REQ-001",
  "requiredBloodGroup": "O Positive",
  "results": [
    {
      "rank": 1,
      "donor_id": "DONOR-001",
      "user_id": "DONOR-001",
      "blood_group": "O Positive",
      "distance_km": 8.4,
      "eligibility_status": "eligible",
      "active_status": "Active",
      "donations_till_date": 4,
      "total_calls": 8,
      "calls_to_donations_ratio": 2,
      "donor_type": "Donor",
      "score": 91,
      "match_score": 91,
      "confidence_label": "High",
      "reason_for_ranking": "Matched O Positive, eligible, Active, 8.4 km away, 4 prior donations, strong engagement score.",
      "recommended_action": "Prioritized for coordinator review; verify availability, logistics, and eligibility through human process."
    }
  ],
  "totalCandidates": 6946,
  "eligibleCandidates": 5,
  "matchTimeMs": 120,
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans."
}
```

## POST /chat

Purpose: generate a safe, coordinator-ready outreach message. It does not send WhatsApp messages.

Request body:

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

Response body:

```json
{
  "message": "Hi Asha, this is Priya from Blood Warriors...",
  "model": "anthropic.claude-3-5-haiku-20241022-v1:0",
  "provider": "AWS Bedrock",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "conversationId": "CONV-...",
  "bedrock_available": true,
  "fallback_used": false
}
```

If Bedrock fails, `fallback_used` is `true` and `bedrock_error_type` may be returned without raw prompt or PII.

## POST /response

Purpose: classify donor response and update request escalation status.

Request body:

```json
{
  "requestId": "REQ-001",
  "donorId": "DONOR-001",
  "responseText": "Yes, I am available",
  "currentRank": 1,
  "rankedDonors": [
    { "rank": 1, "donor_id": "DONOR-001" },
    { "rank": 2, "donor_id": "DONOR-002" }
  ]
}
```

Response body:

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

## POST /impact-story

Purpose: generate safe, anonymized awareness and coordinator-summary content.

Request body:

```json
{
  "donorsContacted": 25,
  "responsesReceived": 8,
  "potentialMatches": 3,
  "campaignCity": "Hyderabad",
  "bloodGroup": "O Positive",
  "patientSafeContext": "Anonymized recurring transfusion support request",
  "tone": "warm"
}
```

Response body:

```json
{
  "awarenessMessage": "In Hyderabad...",
  "socialPost": "Hyderabad blood donation update...",
  "coordinatorSummary": "Campaign city: Hyderabad...",
  "safetyNotice": "AI assists coordination only; final medical eligibility and blood safety remain with authorized humans.",
  "bedrock_available": true,
  "fallback_used": false
}
```

## Error Responses

Bad request:

```json
{
  "error": "BadRequest",
  "message": "Request body is required."
}
```

Server error:

```json
{
  "error": "ServerError",
  "message": "Something went wrong."
}
```

## Not Applicable

- No authentication token contract is implemented.
- No pagination API contract is implemented.
- No GraphQL API exists.
- No WebSocket API exists.
- No production WhatsApp send endpoint exists.

