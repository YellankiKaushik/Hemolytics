# Hemolytics — Database Documentation

## 1. Database Overview

Hemolytics uses Amazon DynamoDB as the main operational data store and Amazon S3 as the dataset source layer for the hackathon MVP. The current database design supports donor records, request records, response tracking, AI outreach conversation context, dashboard analytics, SmartMatch ranking inputs, and estimated coordination-impact metrics.

The implemented data layer is intentionally serverless and lightweight:

- S3 stores the source `Dataset.csv` file outside the GitHub repository.
- The `/load-dataset` Lambda reads rows from S3 or a provided `rows` array.
- `backend/services/dataset_service.py` cleans and normalizes records.
- DynamoDB stores deduplicated donor profiles, generated request records, outreach records, and response records.
- Frontend pages read API responses rather than accessing DynamoDB directly.

This is a hackathon MVP database design. It is not a full production healthcare, blood-bank, or medical operations data system. It provides coordinator-support data organization and workflow intelligence only.

## 2. Data Architecture Summary

Hemolytics turns the Blood Warriors dataset into DynamoDB-backed coordination data through a Lambda ingestion pipeline.

```text
Dataset.csv in S3
    |
    v
POST /load-dataset
    |
    v
handlers/load_dataset.py
    |
    v
services/dataset_service.py
    - CSV reading
    - field normalization
    - donor field derivation
    - duplicate user_id handling
    - request candidate generation
    |
    v
services/dynamodb_service.py
    |
    +--> HemolyticsDonors
    +--> HemolyticsRequests
    |
    v
API endpoints
    |
    v
React frontend pages
    - Dataset Ingestion
    - Dashboard
    - SmartMatch
    - AI Outreach
    - Response Tracking
    - Impact Story
```

The database layer is used by the backend handlers, not by the browser directly. The browser calls API Gateway endpoints through `src/services/api.ts`; API Gateway invokes Lambda; Lambda uses the service layer to read or write DynamoDB and S3.

## 3. Storage Services Used

### Amazon S3

Purpose: source dataset storage.

Hemolytics uses S3 to hold the `Dataset.csv` file that is loaded into DynamoDB through the `/load-dataset` endpoint. The SAM template in `backend/template.yaml` creates a private `DatasetBucket` with public access blocked. If no bucket name is supplied, the template generates a name in the form `hemolytics-dataset-${AWS::AccountId}-${AWS::Region}`. The dataset key defaults to `Dataset.csv`.

Backend files that interact with S3:

- `backend/template.yaml`: defines the S3 bucket and Lambda permissions.
- `backend/services/dataset_service.py`: reads the CSV object using `boto3.client("s3", region_name=AWS_REGION).get_object(...)`.
- `backend/handlers/load_dataset.py`: invokes the dataset service.

Features that depend on S3:

- Dataset ingestion from the deployed S3 dataset object.
- Dataset refresh/reload into DynamoDB.
- Demo flow where the frontend triggers reload through the API.

MVP limitations:

- Browser upload to S3 is not implemented.
- The CSV must be uploaded outside the browser, for example with AWS CLI.
- Raw dataset contents are not documented or committed.
- There is no data versioning workflow documented as an implemented feature.

### Amazon DynamoDB

Purpose: primary operational database for the MVP.

DynamoDB tables are defined in `backend/template.yaml` and accessed through `backend/services/dynamodb_service.py`. The backend uses `boto3.resource("dynamodb", region_name=AWS_REGION)`.

Features that depend on DynamoDB:

- Dashboard metrics.
- SmartMatch donor candidate retrieval.
- Dataset donor/request persistence.
- AI outreach conversation record persistence.
- Response classification and request status update persistence.

MVP limitations:

- No Global Secondary Indexes are defined in the SAM template.
- Dashboard analytics use limited/sample scans for demo-speed reliability.
- SmartMatch scans donors and ranks candidates in service code.
- DynamoDB does not enforce relationships between donor, request, response, and conversation items.

## 4. Dataset Source Layer

The source dataset lives as `Dataset.csv` in S3 and is not committed to GitHub. Ingestion is triggered through `POST /load-dataset`, which can either load from S3 or accept a request body with a `rows` array for local/test flows.

Known live ingestion metrics from the deployed dataset load:

| Metric | Value |
| --- | ---: |
| Rows loaded | 7,033 |
| Unique users created | 6,946 |
| Duplicate user groups handled | 87 |
| Invalid/unknown blood groups flagged | 2,036 |
| Missing locations flagged | 24 |
| Donor records written | 6,946 |
| Request records written | 786 |

The raw dataset rows should not be exposed in documentation, screenshots, commits, or generated content. Public documentation should describe schema, transformations, and aggregate metrics without disclosing personal or sensitive row-level data.

## 5. Dataset Ingestion and Transformation

The ingestion pipeline is implemented in `backend/services/dataset_service.py`.

### Input Modes

The service supports two input modes:

- S3 mode: reads from `S3_DATASET_BUCKET` and `S3_DATASET_KEY`.
- Inline rows mode: accepts a body like `{ "rows": [...] }` for local/test usage.

CSV loading uses `csv.DictReader` over the UTF-8 decoded S3 object body.

### Field Normalization

The service normalizes dataset fields listed in `DATASET_FIELDS`, including:

- user and bridge identifiers: `user_id`, `bridge_id`
- role/status fields: `role`, `role_status`, `bridge_status`, `status`, `status_of_bridge`
- blood fields: `blood_group`, `bridge_blood_group`
- location fields: `latitude`, `longitude`
- request context: `quantity_required`, `expected_next_transfusion_date`
- donor activity: `donations_till_date`, `last_contacted_date`, `last_donation_date`, `total_calls`, `calls_to_donations_ratio`
- eligibility/activity: `eligibility_status`, `user_donation_active_status`
- re-engagement context: `inactive_trigger_comment`

Blood groups are normalized through `normalize_blood_group()`. Known shorthand values such as `O+`, `A-`, and `AB+` are expanded into labels such as `O Positive`, `A Negative`, and `AB Positive`. Unknown or unrecognized values remain as normalized strings; invalid/unknown blood group rows are flagged by derived quality fields.

Dates are parsed through `parse_safe_date()` using several common formats and ISO parsing. If parsing fails, the normalized original value is retained rather than crashing ingestion.

Numeric fields such as `latitude`, `longitude`, `quantity_required`, `donations_till_date`, `total_calls`, `frequency_in_days`, and `calls_to_donations_ratio` are converted to numbers where possible.

### Derived Donor Fields

For each cleaned donor row, the service derives:

- `has_valid_blood_group`
- `has_valid_location`
- `is_match_eligible`
- `donor_experience_score`
- `engagement_score`
- `eligibility_score`
- `location_quality_score`
- `reengagement_priority`
- `bridge_request_candidate`

Important rules:

- `has_valid_blood_group` is true only when `blood_group` exists and is not `Do not Know`.
- `has_valid_location` requires numeric latitude/longitude, non-zero values, and valid coordinate ranges.
- `is_match_eligible` requires valid blood group, valid location, `eligibility_status == "eligible"`, and `user_donation_active_status == "Active"`.
- `donor_experience_score` is capped at `donations_till_date / 10`.
- `engagement_score` combines active status, call history, and calls-to-donations ratio.
- `reengagement_priority` is `High`, `Medium`, or `Low` based on inactive status, comments, and prior calls.
- `bridge_request_candidate` is true when a bridge ID, bridge blood group, or expected next transfusion date exists.

### Duplicate `user_id` Handling

The donor ingestion path deduplicates cleaned donor rows by `user_id` before writing to `HemolyticsDonors`. The most complete donor profile is selected using `_completeness_score()`, which prioritizes:

1. Valid blood group.
2. Valid location.
3. Known eligibility status.
4. Active-status presence.
5. Higher `donations_till_date`.
6. Higher `total_calls`.
7. More recent `last_donation_date` or `last_contacted_date`.
8. Earlier valid row as fallback.

Rows without a `user_id` receive a generated ID in the form `DONOR-<timestamp>-<index>`.

### Request Record Creation

Request records are generated from cleaned rows where `bridge_request_candidate` is true. The current `_request_from_donor()` implementation writes request items with these fields:

- `request_id`
- `required_blood_group`
- `city`
- `latitude`
- `longitude`
- `urgency`
- `quantity_required`
- `needed_by`
- `status`
- `source`
- `created_at`
- `updated_at`

The service uses bridge/request context from the source row to build these records, but the generated request item is intentionally compact. If a bridge ID exists, it is used as the base `request_id`; otherwise the service generates an ID such as `REQ-<user_id>-<row_index>`. If a generated ID collides, a suffix is added until the request ID is unique within the ingestion batch.

### DynamoDB Batch Writes

Dataset loading writes:

- deduplicated donor profiles to `HemolyticsDonors`
- generated request records to `HemolyticsRequests`

`backend/services/dynamodb_service.py` adds a final safety guard in `batch_write_items(table_name, items, key_name=None)`: when a key name is provided, duplicate keys are deduplicated before calling DynamoDB `BatchWriteItem`. This prevents the DynamoDB error `Provided list of item keys contains duplicates`.

### Repeated Load Behavior

The current write behavior uses `put_item` and `batch_writer().put_item(...)`. Re-loading the same dataset overwrites items with the same primary keys. It does not append new donor versions or preserve historical row-level versions.

## 6. DynamoDB Tables Overview

The SAM template defines four DynamoDB tables. All use `PAY_PER_REQUEST` billing.

| Table name | Purpose | Main entity | Primary key | Used by endpoints | Used by frontend pages |
| --- | --- | --- | --- | --- | --- |
| `HemolyticsDonors` | Stores deduplicated donor/user profiles and derived scoring fields | Donor/user profile | `user_id` | `/load-dataset`, `/dashboard`, `/match` | Dataset Ingestion, Dashboard, SmartMatch, Estimated Impact Snapshot |
| `HemolyticsRequests` | Stores generated request records from bridge/request candidate rows and response status updates | Blood request / bridge candidate | `request_id` | `/load-dataset`, `/dashboard`, `/response` | Dataset Ingestion, Dashboard, Response Tracking |
| `HemolyticsResponses` | Stores donor response classification results and escalation context | Donor reply analysis | `response_id` | `/response` | Response Tracking |
| `HemolyticsConversations` | Stores AI outreach message context and Bedrock/fallback metadata | Outreach conversation record | `conversation_id` | `/chat` | AI Outreach |

DynamoDB primary keys are simple partition keys. No sort keys or secondary indexes are defined in the current template.

## 7. HemolyticsDonors Table

Purpose: store one deduplicated donor/user profile per `user_id`.

Defined in:

- `backend/template.yaml`

Written by:

- `backend/services/dataset_service.py`
- `backend/services/dynamodb_service.py`

Read by:

- `backend/handlers/dashboard.py`
- `backend/handlers/match.py`

Primary key:

```text
user_id
```

Example field categories:

| Category | Example fields |
| --- | --- |
| Identity/source fields | `user_id`, `bridge_id`, `role`, `role_status`, `donor_type` |
| Blood group fields | `blood_group`, `bridge_blood_group`, `has_valid_blood_group` |
| Location fields | `latitude`, `longitude`, `has_valid_location`, `location_quality_score` |
| Eligibility/status fields | `eligibility_status`, `user_donation_active_status`, `is_match_eligible`, `eligibility_score` |
| Activity/engagement fields | `donations_till_date`, `total_calls`, `calls_to_donations_ratio`, `last_contacted_date`, `last_donation_date`, `next_eligible_date`, `engagement_score`, `donor_experience_score` |
| Re-engagement fields | `inactive_trigger_comment`, `reengagement_priority` |
| Request candidate context | `bridge_request_candidate`, `quantity_required`, `expected_next_transfusion_date` |
| Metadata | `created_at`, `updated_at` |

Used by Dashboard:

- active/inactive donor counts
- eligible/not eligible counts
- missing blood group and missing location metrics
- blood group distribution
- role distribution
- re-engagement candidate count
- top eligible donor pool

Used by SmartMatch:

- exact blood group match
- eligibility status
- active status
- latitude/longitude distance
- donations and engagement indicators
- confidence label and recommendation text

Safety boundary: a donor record does not mean the person is medically approved, currently available, or safe to donate. It is a coordinator-review data record.

Current limitations:

- No donor availability calendar is stored.
- No donor consent model is implemented.
- No donor profile history table exists.
- No GSI exists for querying by blood group, status, or location.

## 8. HemolyticsRequests Table

Purpose: store generated request/bridge candidate records used by the dashboard and response workflow.

Defined in:

- `backend/template.yaml`

Written by:

- `backend/services/dataset_service.py`
- `backend/services/response_service.py` updates request status when a response is classified.

Read by:

- `backend/handlers/dashboard.py`

Primary key:

```text
request_id
```

Fields generated by the current ingestion code:

| Category | Example fields |
| --- | --- |
| Request identity | `request_id` |
| Blood requirement | `required_blood_group` |
| Request context | `city`, `urgency`, `quantity_required`, `needed_by` |
| Location context | `latitude`, `longitude` |
| Status fields | `status`, `last_response_id` after response update |
| Source/metadata | `source`, `created_at`, `updated_at` |

Dashboard projection also attempts to read bridge-style fields such as `bridge_id`, `bridge_status`, `status_of_bridge`, `bridge_blood_group`, `quantity_required`, and `expected_next_transfusion_date` when present. The current generated request shape is compact, so not every projected bridge field is guaranteed to exist on every request item.

Request ID generation:

- use `bridge_id` when present
- otherwise generate `REQ-<user_id>-<row_index>`
- add suffixes if needed to avoid duplicate `request_id` values in the same batch

Safety boundary: a request record supports coordination. Public documentation and impact content should not expose patient PII or imply verified medical outcomes.

Current limitations:

- No full request lifecycle table exists.
- No coordinator assignment field is required by the current model.
- No patient detail model is documented or exposed.
- No GSI exists for querying requests by status, blood group, city, or urgency.

## 9. HemolyticsResponses Table

Purpose: store donor reply classification and escalation output from the Response Tracking flow.

Defined in:

- `backend/template.yaml`

Written by:

- `backend/services/response_service.py`
- `backend/handlers/response.py`

Primary key:

```text
response_id
```

Fields written by `build_response_record()`:

| Category | Example fields |
| --- | --- |
| Response identity | `response_id` |
| Context references | `request_id`, `donor_id` |
| Reply content | `response_text` |
| Classification | `detected_intent`, `response_status` |
| Coordinator support | `ai_summary`, `next_action` |
| Escalation | `escalation_triggered`, `next_donor_id`, `updated_request_status` |
| Metadata | `created_at` |

Supported intent categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

After writing the response item, the service attempts to update the related `HemolyticsRequests` item with:

- `status`
- `updated_at`
- `last_response_id`

If the request update fails, the response path can still return a saved response with a request update warning.

Safety boundary: response classification supports follow-up decisions only. It does not approve a donor medically, certify blood safety, or confirm a completed donation.

Current limitations:

- Response history is keyed by generated `response_id`, not by a request/donor composite key.
- No GSI exists for querying all responses for a request.
- No audit approval workflow is implemented.

## 10. HemolyticsConversations Table

Purpose: store AI outreach message context generated by the `/chat` endpoint.

Defined in:

- `backend/template.yaml`

Written by:

- `backend/handlers/chat.py`
- `backend/services/dynamodb_service.py`

Primary key:

```text
conversation_id
```

TTL:

- The table has `TimeToLiveSpecification` enabled on the `ttl` attribute.
- The current `/chat` save path does not explicitly set a `ttl` value, so TTL is available at the table level but not currently used by stored outreach records unless a future path writes it.

Fields written by the current `/chat` handler:

| Category | Example fields |
| --- | --- |
| Generated identity | `conversation_id` generated by `put_item()` when missing |
| Conversation type | `type` |
| Context references | `request_id`, `donor_id` |
| Message output | `message` |
| AI metadata | `model`, `provider`, `bedrock_available`, `fallback_used` |
| Metadata | `created_at` |

This table supports AI Outreach record persistence. It does not implement full WhatsApp conversation sync, delivery receipts, read receipts, inbound webhook processing, or message-thread history.

## 11. Table Relationships and Logical Data Model

DynamoDB does not enforce foreign keys. Hemolytics uses application-level references between items.

```text
S3 Dataset.csv
    |
    v
Cleaned dataset rows
    |
    +--> HemolyticsDonors
    |       PK: user_id
    |       One logical user profile after deduplication
    |
    +--> HemolyticsRequests
            PK: request_id
            Generated from bridge/request candidate rows

SmartMatch
    request input + HemolyticsDonors
        -> ranked donor candidates

AI Outreach
    selected donor + request context
        -> HemolyticsConversations

Response Tracking
    donor reply + ranked donor context
        -> HemolyticsResponses
        -> optional HemolyticsRequests status update

Dashboard
    HemolyticsDonors + HemolyticsRequests
        -> sampled metrics and data-quality summaries

Impact Story / Estimated Impact Snapshot
    API payloads + dashboard/load summary metrics
        -> anonymized coordination-support messaging
```

Logical relationship notes:

- One dataset user may become one donor record after deduplication.
- Request records are created from bridge/request candidate fields in source rows.
- SmartMatch connects request input to donor candidates but does not write match results to DynamoDB.
- Outreach records can reference a donor and request when those IDs are provided.
- Response records can reference a donor and request and may update request status.
- Dashboard metrics aggregate donor/request tables.
- Impact Story currently uses request payload and frontend impact metrics rather than persisting story records.

## 12. Data Access Patterns

Current endpoint access patterns:

| Endpoint | Database behavior |
| --- | --- |
| `POST /load-dataset` | Reads `Dataset.csv` from S3 or inline rows, writes donor profiles to `HemolyticsDonors`, writes request records to `HemolyticsRequests` |
| `GET /dashboard` | Reads limited samples from `HemolyticsDonors` and `HemolyticsRequests` using `scan_limited()` |
| `POST /match` | Reads donors from `HemolyticsDonors` using `get_donors()` / full scan, ranks candidates in service logic |
| `POST /chat` | Generates AI/fallback outreach message and writes one record to `HemolyticsConversations` |
| `POST /response` | Writes one record to `HemolyticsResponses` and attempts to update one request in `HemolyticsRequests` |
| `POST /impact-story` | Generates Bedrock/fallback content; no DynamoDB read/write is performed by the current handler |
| `GET /health` | No database dependency |

The shared service layer handles:

- table lookup with `get_table()`
- scans with `scan_all()` and `scan_limited()`
- single-item writes with `put_item()`
- request updates with `update_item()`
- batch writes with duplicate-key safety
- Decimal conversion for DynamoDB compatibility

## 13. Dashboard Data Model Usage

The dashboard is implemented in `backend/handlers/dashboard.py`. It uses sampled/limited reads to avoid Lambda timeouts on the real dataset.

Limits:

- `DASHBOARD_SCAN_LIMIT` defaults to `1000` donor records.
- `DASHBOARD_REQUEST_SCAN_LIMIT` defaults to `500` request records.

The handler tries to use `ProjectionExpression` to read only the fields needed for dashboard metrics. If projection fails, it falls back to a normal limited scan.

Donor fields used for dashboard metrics include:

- `user_id`
- `role`
- `blood_group`
- `eligibility_status`
- `user_donation_active_status`
- `has_valid_location`
- `has_valid_blood_group`
- `reengagement_priority`
- `is_match_eligible`
- `donations_till_date`
- `total_calls`
- `donor_type`
- `latitude`
- `longitude`

Request fields projected for dashboard metrics include:

- `request_id`
- `bridge_id`
- `bridge_status`
- `status_of_bridge`
- `bridge_blood_group`
- `quantity_required`
- `expected_next_transfusion_date`

Dashboard response fields include:

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

`dashboardMode` is returned as `sampled`. This is intentional for demo-speed reliability. It should not be represented as a full analytical warehouse or exact full-table dashboard.

## 14. SmartMatch Data Model Usage

SmartMatch is implemented through:

- `backend/handlers/match.py`
- `backend/services/scoring_service.py`
- `backend/services/dynamodb_service.py`

The handler reads donor records from `HemolyticsDonors` and ranks candidates in memory.

Match request inputs can include:

- `requestId` or `request_id`
- `requiredBloodGroup` or `required_blood_group`
- `latitude`
- `longitude`
- `city`
- `urgency`
- `quantityRequired` or `quantity_required`
- `neededBy` or `needed_by`

Candidate filtering and scoring uses:

- exact normalized blood group match
- `eligibility_status == "eligible"`
- `user_donation_active_status == "Active"` for strict pass
- valid latitude and longitude
- distance via haversine formula
- engagement score
- donor experience score
- eligibility score
- location quality score

If fewer than five strict matches are found, the scoring service can relax active-status requirements for backup candidates while still requiring:

- valid blood group
- exact blood group match
- eligible status
- valid location

SmartMatch output includes ranked donor fields such as:

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
- `confidence_label`
- `reason_for_ranking`
- `recommended_action`

Safety boundary: SmartMatch is a ranking layer. It prioritizes donors for coordinator review and contact. It does not guarantee donor availability, certify donor eligibility, certify donor health, or certify blood safety.

## 15. Response Tracking Data Model Usage

Response Tracking sends donor reply text to `POST /response`. The backend classifies the response and stores an analysis record in `HemolyticsResponses`.

Input fields can include:

- `requestId` / `request_id`
- `donorId` / `donor_id`
- `responseText` / `response_text`
- `currentRank` / `current_rank`
- `rankedDonors` / `ranked_donors`

Classification categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Status logic:

- confirm -> `donor_confirmed`
- decline -> escalation path
- no response -> escalation path
- reschedule -> `needs_follow_up`
- no available next donor -> `needs_coordinator_attention`

The response service writes the response item and, when `request_id` is present, attempts to update the related `HemolyticsRequests` record. This creates visible status movement for the demo workflow without requiring a full production request lifecycle table.

Safety boundary: donor response classification is an assistant for coordinator follow-up. It is not a medical determination or donation-completion record.

## 16. Impact Story and Estimated Impact Data Usage

Impact Story is implemented through `POST /impact-story` and frontend rendering in `src/pages/ImpactStory.tsx`. The backend generates an awareness message, social post, and coordinator summary through AWS Bedrock or safe fallback behavior.

The current `impact_story.py` handler does not read from or write to DynamoDB. The frontend also shows an `Estimated Impact Snapshot` component, implemented in `src/components/ImpactSnapshot.tsx`, which uses live page data when available and safe fallback metrics from known dataset summary values.

Impact Snapshot appears on:

- Landing page
- Dashboard
- Impact Story page

Metrics used by the frontend snapshot include:

- dataset records processed
- unique people/user records organized
- request records identified
- duplicate groups handled
- invalid/unknown blood groups flagged
- missing locations flagged
- sampled dashboard records
- active donors in sampled dashboard
- top five donor prioritization framing

Impact Story and Estimated Impact Snapshot must be framed as coordination-support metrics. They must not claim:

- people were saved
- donations were completed
- donors were medically approved
- blood safety was certified
- patient outcomes were guaranteed

## 17. Data Quality Handling

Data quality handling is built into `backend/services/dataset_service.py`.

Handled data quality cases:

- duplicate `user_id` groups
- missing `user_id`
- invalid or unknown blood groups
- missing or invalid latitude/longitude
- incomplete eligibility/status values
- parseable and unparseable dates
- numeric conversion failures
- duplicate generated request IDs within a batch

Known live data quality metrics:

| Data quality item | Count |
| --- | ---: |
| Duplicate groups handled | 87 |
| Invalid/unknown blood groups flagged | 2,036 |
| Missing locations flagged | 24 |

Data quality fields used downstream:

- `has_valid_blood_group`
- `has_valid_location`
- `is_match_eligible`
- `location_quality_score`
- `eligibility_score`
- `reengagement_priority`

Dashboard displays data quality through missing blood group, missing location, location coverage, re-engagement candidates, and sampled-mode helper messaging.

## 18. Data Safety and Ethical Boundaries

Database records in Hemolytics do not:

- certify donor health
- certify donor eligibility
- certify blood safety
- guarantee donor availability
- confirm a completed donation
- prove people were saved
- replace coordinators or authorized medical staff

Database records do:

- support coordinator review
- organize donor and request data
- enable donor prioritization
- support follow-up workflows
- record AI outreach context
- record donor response classification
- support anonymized awareness reporting
- provide coordination-support metrics

Every workflow must preserve the boundary that final donor eligibility, logistics, medical suitability, and blood safety remain human-led and handled by authorized coordinators/medical staff.

## 19. Privacy and Sensitive Data Considerations

The source dataset should not be committed to the repository. `.gitignore` excludes `Dataset.csv`, `.env*` files, credentials, build output, and AWS/SAM artifacts.

Current privacy expectations:

- Do not include raw dataset rows in public documentation.
- Do not expose patient PII in Impact Story content.
- Do not store AWS credentials or secrets in code.
- Keep dataset upload and AWS credentials outside the frontend repository.
- Use safe, anonymized wording for awareness messaging.

Production privacy needs not yet implemented:

- authentication
- role-based access control
- PII masking
- audit logs
- consent-aware outreach controls
- data retention policies
- secure admin workflows
- compliance review
- production security testing

This documentation does not claim HIPAA or medical compliance.

## 20. Current Indexing and Query Strategy

Current DynamoDB strategy:

- Simple partition keys only.
- `HemolyticsDonors` partition key: `user_id`
- `HemolyticsRequests` partition key: `request_id`
- `HemolyticsResponses` partition key: `response_id`
- `HemolyticsConversations` partition key: `conversation_id`
- No sort keys.
- No GSIs.
- No LSIs.

Current query/read behavior:

- Dashboard uses limited scans and projections.
- SmartMatch scans donor records and ranks candidates in service code.
- Response Tracking writes one response and updates one request by primary key.
- AI Outreach writes one conversation item.
- Dataset ingestion batch-writes donor and request items.

This is acceptable for the hackathon MVP because the dataset is modest and the dashboard uses sampling to stay responsive. For production, the system would need better indexing for blood group, eligibility, active status, location, request status, and time-based access patterns.

## 21. Database Limitations

Current MVP limitations:

- No production authentication/RBAC around data access.
- Dashboard uses sampled analytics rather than full-table aggregation.
- SmartMatch is not optimized with GSIs or geospatial indexes.
- No donor availability calendar table exists.
- No full request lifecycle table exists.
- No coordinator assignment table exists.
- No audit logs table exists.
- No notification events table exists.
- No outreach delivery/read receipt table exists.
- No response-by-request GSI exists.
- No donor history/versioning table exists.
- No production compliance/data governance certification is implemented.
- No DynamoDB Streams or background aggregation jobs are configured.
- No point-in-time recovery setting is documented in the current SAM template.

These limitations are expected for a hackathon MVP and should be addressed before production use.

## 22. Future Database Roadmap

The detailed production roadmap lives in `docs/FUTURE_ENHANCEMENTS.md`. Database-focused future upgrades could include:

| Future table/index | Purpose |
| --- | --- |
| `Coordinators` | store coordinator identities, assignments, roles, and team ownership |
| `DonorAvailability` | track preferred contact times, temporary unavailability, cooldowns, and availability windows |
| `RequestLifecycle` | store request status timeline, coordinator notes, manual overrides, and verification steps |
| `OutreachEvents` | track generated/sent messages, channel, consent, delivery metadata, and template version |
| `NotificationEvents` | support SMS/email/WhatsApp/push notification queues and outcomes |
| `AuditLogs` | provide immutable review history for sensitive actions |
| `Campaigns` | support awareness campaigns, nonprofit partner campaigns, and city/blood-group drives |
| `ImpactMetrics` | store anonymized coordination metrics over time |

Future indexing and governance improvements:

- GSIs for blood group, active status, eligibility, request status, and coordinator assignment.
- Geospatial lookup strategy for distance-aware matching.
- TTL on short-lived conversation/outreach data where appropriate.
- Data retention policies.
- Backup/restore strategy.
- DynamoDB Streams for background aggregation.
- Least-privilege access patterns per function.
- Audit and approval workflow for sensitive operations.

These are future enhancements, not implemented database features in the current MVP.

## 23. Database Documentation Summary

Hemolytics uses S3 and DynamoDB to turn a dataset into operational donor/request intelligence for a hackathon-ready MVP. S3 holds the private source dataset, while DynamoDB stores deduplicated donor profiles, generated request records, AI outreach conversation context, and donor response classifications.

The database layer supports ingestion, dashboarding, SmartMatch, response tracking, AI Outreach persistence, and safe impact storytelling. It also includes practical MVP safeguards such as donor deduplication, duplicate batch-write protection, Decimal conversion, dashboard sampling, and safe data-quality flags.

The current database is deliberately separated from medical certification and blood safety approval. It helps coordinators organize and prioritize information; it does not certify donor health, donor eligibility, blood safety, completed donations, or real-world medical outcomes.
