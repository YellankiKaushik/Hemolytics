# Hemolytics — Frontend Documentation

## 1. Frontend Overview

The Hemolytics frontend is a React + Vite + TypeScript + Tailwind CSS single page application hosted on AWS Amplify.

It provides the coordinator-facing workflow for the hackathon MVP:

- Landing
- Dataset Ingestion
- Dashboard
- SmartMatch
- AI Outreach
- Response Tracking
- Impact Story
- API Settings
- Estimated Impact Snapshot

The frontend is designed to turn backend donor/request intelligence into a clear, judge-friendly and coordinator-friendly workflow. It is a complete hackathon-ready MVP frontend, not a full production operations console yet.

Production-grade capabilities such as authentication, role-based coordinator workspaces, donor profile detail pages, notification inboxes, and full request lifecycle management are future enhancements.

## 2. Frontend Responsibilities

The frontend is responsible for:

- presenting the Hemolytics product workflow clearly
- routing users through the MVP demo sequence
- connecting to the backend API through `src/services/api.ts`
- displaying dataset ingestion results
- displaying dashboard intelligence and data quality indicators
- allowing SmartMatch donor ranking requests
- showing ranked donor outputs and coordinator review language
- generating safe outreach messages through backend API calls
- classifying donor replies through backend API calls
- showing response status, escalation, and next action feedback
- generating safe impact story/awareness outputs
- displaying estimated impact metrics with safe wording
- handling loading, empty, success, fallback, and error states
- providing responsive desktop and mobile navigation

The frontend does not directly access AWS credentials, does not upload CSV files to S3 from the browser, does not send WhatsApp messages automatically, and does not make medical or blood safety decisions.

## 3. Frontend Architecture Diagram

```text
User Browser
  |
  v
React App / Vite
  |
  v
src/main.tsx
  |
  v
src/App.tsx
  |
  +--> BrowserRouter
  +--> Layout app shell
       |
       +--> Desktop sidebar
       +--> Mobile drawer
       +--> Safety banner
       +--> Step flow indicator
       |
       v
Pages
  |
  +--> Landing
  +--> Dataset Ingestion
  +--> Dashboard
  +--> SmartMatch
  +--> AI Outreach
  +--> Response Tracking
  +--> Impact Story
  +--> API Settings
  |
  v
Reusable Components
  |
  +--> ImpactSnapshot
  |
  v
src/services/api.ts
  |
  +--> Mock Mode when VITE_API_BASE_URL is empty
  +--> AWS Connected Mode when VITE_API_BASE_URL is set
  |
  v
Backend API Gateway
  |
  +--> GET /health
  +--> GET /dashboard
  +--> POST /load-dataset
  +--> POST /match
  +--> POST /chat
  +--> POST /response
  +--> POST /impact-story
```

The app is frontend-only at runtime. Backend execution occurs through the API Gateway base URL configured by `VITE_API_BASE_URL`.

## 4. Frontend Folder Structure

Actual frontend-related structure inspected in the repository:

```text
.
├── amplify.yml
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── assets/
│   ├── components/
│   │   ├── ImpactSnapshot.tsx
│   │   └── Layout.tsx
│   ├── config/
│   │   └── apiConfig.ts
│   ├── data/
│   │   └── mockData.ts
│   ├── pages/
│   │   ├── AiOutreach.tsx
│   │   ├── ApiSettings.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DatasetIngestion.tsx
│   │   ├── ImpactStory.tsx
│   │   ├── Landing.tsx
│   │   ├── ResponseTracking.tsx
│   │   └── SmartMatch.tsx
│   ├── services/
│   │   └── api.ts
│   ├── store/
│   │   └── useAppStore.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── datasetCleaning.ts
│       ├── escalation.ts
│       ├── formatters.ts
│       ├── responseClassifier.ts
│       └── scoring.ts
```

Notes from inspection:

- No `vite.config.ts` or `vite.config.js` file is currently present. The app uses Vite defaults plus root config files.
- `postcss.config.js` exists and configures Tailwind and Autoprefixer.
- `tailwind.config.js` exists and scans `index.html` plus `src/**/*.{js,ts,jsx,tsx}`.
- `src/types/index.ts` exists but is currently empty, while multiple files import type names from it. This is a current typing/documentation limitation, not changed by this docs update.

Folder/file purposes:

- `src/main.tsx`: React entrypoint.
- `src/App.tsx`: route definitions and shared layout route.
- `src/index.css`: global CSS, font imports, Tailwind directives, CSS variables, mobile overflow helpers.
- `src/components/`: reusable app shell and impact snapshot components.
- `src/pages/`: route-level UI screens.
- `src/services/api.ts`: API client and mock-mode fallback behavior.
- `src/config/apiConfig.ts`: API base URL, mode flag, AWS display constants, endpoint paths.
- `src/store/useAppStore.ts`: lightweight Zustand shared state.
- `src/data/mockData.ts`: mock donors, requests, dashboard metrics, cleaning summary, and responses for Mock Mode.
- `src/utils/`: local mock-mode helpers for dataset cleaning concepts, SmartMatch scoring, response classification, escalation, and formatting.
- `amplify.yml`: AWS Amplify Hosting build configuration.
- `package.json`: dependencies and scripts.

## 5. Application Entry Point

The application starts in:

```text
src/main.tsx
```

Actual behavior:

- imports React and ReactDOM
- imports `App` from `src/App.tsx`
- imports global styles from `src/index.css`
- renders the app into the DOM element with id `root`
- wraps `<App />` in `<React.StrictMode>`

The HTML root is defined in:

```text
index.html
```

with:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

There are no global context providers around `App` in `main.tsx`. Shared state is handled by Zustand through direct hook imports where needed.

## 6. Routing Architecture

Routing is defined in:

```text
src/App.tsx
```

The app uses:

- `BrowserRouter`
- `Routes`
- `Route`
- `Navigate`
- `Layout` as the shared route shell

Route table:

| Route | Page component | Purpose | Backend API dependency |
|---|---|---|---|
| `/` | `Landing` | Default landing page for judges/users | None direct |
| `/dashboard` | `Dashboard` | Donor/request/data quality dashboard | `GET /dashboard` through `getDashboard()` |
| `/dataset-ingestion` | `DatasetIngestion` | Reload S3 dataset into DynamoDB | `POST /load-dataset` through `loadDataset()` |
| `/dataset` | redirect | Alias to Dataset Ingestion | Redirect only |
| `/smartmatch` | `SmartMatch` | Run donor ranking workflow | `POST /match` through `runSmartMatch()` |
| `/ai-outreach` | `AiOutreach` | Generate coordinator-ready outreach copy | `POST /chat` through `generateOutreachMessage()` |
| `/outreach` | redirect | Alias to AI Outreach | Redirect only |
| `/response-tracking` | `ResponseTracking` | Classify replies and show escalation | `POST /response` through `submitDonorResponse()` |
| `/responses` | redirect | Alias to Response Tracking | Redirect only |
| `/impact-story` | `ImpactStory` | Generate safe awareness/impact content | `POST /impact-story` through `generateImpactStory()` |
| `/impact` | redirect | Alias to Impact Story | Redirect only |
| `/api-settings` | `ApiSettings` | Show AWS/API/backend contract visibility | No live health call in current page; uses config constants |

No wildcard/not-found route is currently defined. Unknown routes are not explicitly handled by a 404 page in `src/App.tsx`.

## 7. Layout and Navigation Architecture

The shared app shell is implemented in:

```text
src/components/Layout.tsx
```

Current layout behavior:

- desktop sidebar is fixed on the left
- desktop sidebar width is `280px`
- desktop main content uses `md:pl-[280px]`
- desktop sidebar is always expanded
- mobile hides the desktop sidebar
- mobile shows a compact top header with a menu button
- mobile drawer opens over content
- mobile drawer closes after navigation
- a dismissible safety banner appears below the mobile header/sidebar area
- a horizontal step flow indicator appears across the top of content
- route content is rendered through `<Outlet />`

Navigation items:

- Home
- Dataset Ingestion
- Dashboard
- SmartMatch
- AI Outreach
- Response Tracking
- Impact Story
- API Settings

Step flow items:

- Home
- Dataset
- Dashboard
- SmartMatch
- Outreach
- Responses
- Impact
- API

The layout was hardened for both desktop and mobile usability:

- desktop collapse behavior was removed
- sidebar stays stable on larger screens
- mobile drawer state is separate from desktop behavior
- content avoids being hidden behind sidebar
- safety notice is dismissible to reduce vertical pressure
- step flow is horizontally scrollable on small screens

## 8. Reusable Components

### `src/components/Layout.tsx`

Purpose: shared app shell and navigation system.

Props: none. It uses React Router hooks internally.

Where used: `src/App.tsx` as the layout route wrapper.

Design/safety role:

- keeps all MVP pages connected through consistent navigation
- displays the global safety note
- displays backend architecture/status card in the sidebar
- preserves mobile drawer usability

### `src/components/ImpactSnapshot.tsx`

Purpose: reusable safe “Estimated Impact Snapshot” card group.

Props:

```ts
type ImpactSnapshotProps = {
  metrics?: {
    recordsProcessed?: number;
    uniqueRecords?: number;
    requestRecords?: number;
    donorProfilesPrioritized?: number | string;
    invalidBloodGroupsFlagged?: number;
    missingLocationFlagged?: number;
    duplicateGroupsHandled?: number;
    sampledRecords?: number;
    activeDonors?: number;
    activeRequests?: number;
    responsesClassified?: number;
    coordinatorTimeSaved?: string;
  };
  variant?: 'strong' | 'compact';
  className?: string;
  contextNote?: string;
};
```

Where used:

- `src/pages/Landing.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ImpactStory.tsx`

Design/safety role:

- shows records processed, unique records organized, request records identified, donor profiles prioritized, data quality flags, and coordinator time saved
- uses fallback dataset load metrics when live page data is not available
- explicitly frames values as coordination-support indicators, not medical outcome claims
- avoids “people saved” language and avoids donation completion claims

## 9. Styling System

Styling uses Tailwind CSS, root CSS variables, and utility classes.

Files:

- `src/index.css`
- `tailwind.config.js`
- `postcss.config.js`

`src/index.css` includes:

- Google font imports for `DM Sans` and `Space Grotesk`
- `@tailwind base`
- `@tailwind components`
- `@tailwind utilities`
- CSS variables for brand and status colors
- global `box-sizing`
- body background/text/font smoothing
- `overflow-x: hidden` on `html`, `body`, and `#root`
- touch-friendly form/button behavior
- `.mobile-safe-text` helper for wrapping long IDs, URLs, generated text, and labels
- custom scrollbar styling

`tailwind.config.js` includes:

- content paths:
  - `./index.html`
  - `./src/**/*.{js,ts,jsx,tsx}`
- custom `xs` screen at `390px`

`postcss.config.js` includes:

- Tailwind CSS plugin
- Autoprefixer

Responsive approach:

- page wrappers use smaller mobile padding and larger desktop padding
- cards stack in one column on mobile
- form grids collapse on smaller screens
- buttons frequently become full width on mobile
- tables in API Settings use mobile card alternatives or horizontal scrolling
- long text uses wrapping/truncation helpers

Amplify production styling note:

- Amplify builds with `npm run build`
- CSS is generated into Vite `dist` assets
- Tailwind directives and content paths are present, which is required for production styling to render correctly

## 10. API Service Layer

The API client is implemented in:

```text
src/services/api.ts
```

Configuration is in:

```text
src/config/apiConfig.ts
```

Base URL and mode:

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const IS_AWS_CONNECTED: boolean = API_BASE_URL.length > 0;
```

Endpoint constants:

- `/health`
- `/dashboard`
- `/match`
- `/chat`
- `/response`
- `/impact-story`
- `/load-dataset`

Fetch behavior:

- `apiFetch<T>(method, path, body?)` builds URL as `${API_BASE_URL}${path}`
- sends `Content-Type: application/json`
- stringifies body when supplied
- throws `Error("API error <status>: <body>")` when response is not OK
- parses successful responses with `res.json()`

Mode behavior:

- AWS Connected Mode: functions call API Gateway endpoints
- Mock Mode: functions return local mock data or run local utility logic

API function mapping:

| API function | Endpoint | Page using it | Purpose | Error/fallback behavior |
|---|---|---|---|---|
| `getHealth()` | `GET /health` | API Settings / diagnostics potential | Health metadata | Mock health object when not connected |
| `getDashboard()` | `GET /dashboard` | Dashboard | Dashboard metrics | Mock dashboard metrics when not connected |
| `loadDataset()` | `POST /load-dataset` | Dataset Ingestion | Reload S3 dataset into DynamoDB | Mock load summary with simulated delay when not connected |
| `runSmartMatch(request)` | `POST /match` | SmartMatch | Rank donors | Local scoring against mock donors when not connected |
| `generateOutreachMessage(context)` | `POST /chat` | AI Outreach | Generate outreach copy | Local generated message when not connected |
| `submitDonorResponse(payload)` | `POST /response` | Response Tracking | Classify reply and escalation | Local classifier/escalation when not connected |
| `generateImpactStory(payload)` | `POST /impact-story` | Impact Story | Generate awareness content | Local safe content when not connected |

Important boundary:

- `src/services/api.ts` contains local demo/fallback logic for Mock Mode, but the production backend contract remains the API Gateway routes documented in `docs/API_DOCUMENTATION.md`.

## 11. State and Type Architecture

Shared state file:

```text
src/store/useAppStore.ts
```

It uses Zustand and defines:

- `sidebarOpen`
- `toggleSidebar`
- `activeRequestId`
- `setActiveRequestId`
- `selectedDonorId`
- `setSelectedDonorId`
- `datasetLoaded`
- `setDatasetLoaded`

Current usage observed:

- `DatasetIngestion.tsx` uses `setDatasetLoaded(true)` after a successful load.
- Layout currently manages its mobile drawer state locally instead of using the store sidebar state.
- Several page-level interactions use local `useState` rather than global state, which is appropriate for the MVP.

Types:

- `src/types/index.ts` exists but is currently empty.
- Several frontend files import type names such as `Donor`, `BloodGroup`, `MatchResult`, `BloodRequest`, `DonorResponse`, `ResponseStatus`, `OutreachTone`, and `OutreachLanguage` from `src/types`.
- This documentation update does not modify code, but the empty type file should be treated as a future cleanup item if strict TypeScript validation is added.

Local utility types:

- `src/utils/responseClassifier.ts` exports `Intent`
- `src/utils/escalation.ts` exports `EscalationResult`
- `src/utils/datasetCleaning.ts` and `src/utils/scoring.ts` export `ReengagementPriority`

Why typing matters:

- match results cross SmartMatch, AI Outreach, and Response Tracking
- dashboard fields depend on backend response shape
- response classification and escalation need stable names
- future hardening should make these shared interfaces explicit in `src/types/index.ts`

## 12. Landing Page

File:

```text
src/pages/Landing.tsx
```

Purpose:

- introduce Hemolytics quickly for judges and first-time users
- position the product as AI-powered blood donation coordination for Blood Warriors
- explain the MVP workflow
- show architecture badge
- show safety principle
- provide demo navigation CTAs
- show Estimated Impact Snapshot
- show a future production roadmap section clearly marked as not yet built

Key UI areas:

- hero section with product name and hackathon context
- safety principle card
- outcome cards for dataset intelligence, SmartMatch, and AI-assisted workflow
- final MVP workflow strip
- `ImpactSnapshot`
- future roadmap tags

Safety role:

- states AI assists coordination only
- states it does not certify donor health, eligibility, or blood safety
- frames roadmap items as future, not completed production features

## 13. Dataset Ingestion Page

File:

```text
src/pages/DatasetIngestion.tsx
```

Purpose:

- let the user trigger dataset reload from S3 into DynamoDB
- display the exact backend load result fields
- clarify that browser upload is not part of the MVP

Primary user action:

- click `Load / Reload Dataset from S3`

API call:

- `loadDataset()`
- `POST /load-dataset`

Loading/error/success behavior:

- disables button while loading
- shows loading spinner/text
- shows a default message before any load has run
- shows visible error panel with retry button
- shows visible success panel and detailed returned fields on success

Displayed backend fields:

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

Backend relationship:

- browser calls Lambda through API Gateway
- Lambda reads `Dataset.csv` from S3
- Lambda writes donor/request records to DynamoDB

Safety boundary:

- dataset processing supports coordinator analytics only
- it does not certify donor health, eligibility, or blood safety

## 14. Dashboard Page

File:

```text
src/pages/Dashboard.tsx
```

Purpose:

- show sampled donor/request/data quality metrics
- provide a cleaner operational snapshot for first-time users
- show compact impact summary near the top

API call:

- `getDashboard()`
- `GET /dashboard`

Page behavior:

- loads metrics in `useEffect`
- shows loading state while fetching
- shows error state with retry by page reload
- normalizes numeric fields through local helper functions
- handles missing arrays by falling back to empty arrays
- limits top eligible donor pool display

Metrics displayed include:

- donor network metrics
- dataset quality metrics
- active request metrics
- re-engagement metrics
- blood group distribution
- role distribution
- recent activity
- top eligible donor pool
- `sampledRecords`
- `dashboardMode`

Estimated Impact Snapshot:

- uses `variant="compact"`
- passes live dashboard values where available
- falls back to known safe dataset metrics where page data is missing

Safety boundary:

- dashboard analytics are coordination-support indicators
- sampled metrics are not medical outcomes or confirmed donations

## 15. SmartMatch Page

File:

```text
src/pages/SmartMatch.tsx
```

Purpose:

- let coordinators configure a request and rank donor candidates
- display top ranked donors as cards
- show why candidates were ranked

API call:

- `runSmartMatch(request)`
- `POST /match`

Request inputs:

- Request ID
- Required Blood Group
- City / Location
- Urgency
- Quantity Required
- Needed By

Current city options:

- Hyderabad
- Mumbai
- Delhi
- Bengaluru
- Chennai
- Pune

Output display:

- top 5 ranked donors
- rank badge
- donor name / donor ID
- blood group
- role
- distance
- donation count
- match score
- engagement percent
- confidence label
- reason
- recommended action
- select donor action

No-result/empty behavior:

- before running, page shows an empty state asking the user to configure a request and run SmartMatch
- on error, page shows `SmartMatch Unavailable`

Safety wording:

- “SmartMatch ranks donors to contact first”
- “It does not guarantee real-time availability”
- “Prioritized for coordinator review, not medical approval”
- footer repeats that Hemolytics does not certify donor health or blood safety

## 16. AI Outreach Page

File:

```text
src/pages/AiOutreach.tsx
```

Purpose:

- generate coordinator-ready outreach copy for a selected request/donor
- show model/provider/safety metadata
- support manual coordinator copy/send workflow

API call:

- `generateOutreachMessage(context)`
- `POST /chat`

Inputs:

- selected request from mock request list
- selected eligible donor from mock donor list
- tone
- language
- Priya coordinator persona

Tone options:

- urgent
- empathetic
- short SMS
- WhatsApp-style
- formal coordinator message

Language options:

- English
- Hindi

Important UI boundary:

- WhatsApp-style is a tone label only
- the app does not send WhatsApp messages automatically

Output behavior:

- generated message preview
- regenerate button
- copy message button
- mark as sent local UI button
- model/provider/conversation/safety details
- “Safe fallback message used” indicator when `fallback_used` is true
- error panel if generation fails

Safety boundaries:

- coordinator-ready copy only
- no donor health certification
- no blood safety certification
- no medical claims
- final verification remains human-led

## 17. Response Tracking Page

File:

```text
src/pages/ResponseTracking.tsx
```

Purpose:

- allow testing donor reply classification
- show visible response analysis after submission
- update the visible response board state
- explain escalation behavior

API call:

- `submitDonorResponse(payload)`
- `POST /response`

Reply input:

- text area initialized with `Yes, I am available`
- quick sample buttons:
  - `Yes, I am available.`
  - `Sorry, I cannot donate today.`
  - `I can come tomorrow evening.`

Classification categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Displayed analysis:

- detected intent
- response status
- escalation triggered
- next donor ID
- AI summary
- next action
- updated request status

The page includes a “Latest AI Response Analysis” panel and response history/board display. It maps backend statuses into human-readable frontend status labels such as `Donor confirmed`, `Escalated`, and `Needs follow-up`.

Safety boundary:

- response classification supports coordinator follow-up only
- it is not medical approval
- it does not verify donation completion

## 18. Impact Story Page

File:

```text
src/pages/ImpactStory.tsx
```

Purpose:

- generate safe awareness messaging from coordination metrics
- show impact framing without patient PII or medical outcome claims
- combine API-generated content with Estimated Impact Snapshot

API call:

- `generateImpactStory(payload)`
- `POST /impact-story`

Inputs:

- donors contacted
- responses received
- potential matches
- campaign city
- blood group
- patient-safe context
- tone

Output sections:

- awareness message
- social post
- coordinator summary
- safety notice
- fallback indicator when used

Coordination impact section:

- `ImpactSnapshot` appears near the top
- metrics include donor contacts, response counts, potential matches, and safe fallback dataset indicators
- context note explains that inputs are converted into safe awareness messaging

Safety framing:

- no patient PII
- no fake medical claims
- no guaranteed survival claims
- no claim that donation happened unless clearly simulated/demo
- impact metrics are coordination-support indicators

## 19. API Settings Page

File:

```text
src/pages/ApiSettings.tsx
```

Purpose:

- show current frontend API mode
- display backend base URL when connected
- show architecture and endpoint contract
- show DynamoDB table names and keys
- show AI model display configuration
- support demo/debugging visibility

Displayed areas:

- AWS Connected Mode or Mock Mode banner
- live check cards for selected endpoint behaviors
- frontend environment block with `VITE_API_BASE_URL`
- AWS architecture cards
- API endpoints table/cards
- DynamoDB table cards
- AI model configuration card
- production readiness notes

Important note:

- The page reads `IS_AWS_CONNECTED`, `API_BASE_URL`, and `BEDROCK_MODEL_ID` from frontend config.
- It does not currently perform a live health fetch by itself.
- It clearly states no AWS credentials or secrets belong in frontend source code.

## 20. Estimated Impact Snapshot Frontend Design

Component:

```text
src/components/ImpactSnapshot.tsx
```

Why it was added:

- to give judges and users a fast, visual sense of potential coordination impact
- to use real loaded dataset summary values when available
- to avoid unsafe claims about lives saved, medical approval, or completed donations

Where it appears:

- Landing
- Dashboard
- Impact Story

Metrics displayed:

- Records Processed
- Unique People/User Records Organized
- Request Records Identified
- Donor Profiles Prioritized
- Data Quality Flags
- Coordinator Time Saved

Fallback values embedded in the component:

- `7033` records processed
- `6946` unique records
- `786` request records
- `87` duplicate groups handled
- `2036` invalid/unknown blood groups flagged
- `24` missing locations flagged
- `1000` sampled dashboard records
- `905` active donors
- `500` active/bridge requests
- `Top 5` donor profiles prioritized

Safe wording examples used by the component:

- “coordination-support metrics, not medical outcome claims”
- “SmartMatch ranks donors to contact first, not guaranteed available donors”
- “final verification remains human-led”
- “estimated coordination indicators only”

## 21. Frontend Safety and Ethical Wording

The frontend avoids:

- “people saved” claims
- donor medical approval
- donor eligibility certification
- blood safety certification
- guaranteed donor availability
- guaranteed survival or medical outcome claims
- automatic WhatsApp sending claims
- patient PII in impact content

The frontend uses language such as:

- coordinator review
- potential match
- ranked to contact first
- human verification required
- coordination-support metrics
- estimated impact indicators
- AI-assisted suggestions
- final decisions remain with authorized human/medical staff

Safety appears in:

- global layout safety banner
- Landing safety principle card
- Dataset Ingestion footer
- Dashboard sampled-mode/helper text
- SmartMatch safety note and footer
- AI Outreach safety note and footer
- Response Tracking explanation
- Impact Story safety rules and footer
- API Settings safety configuration card
- ImpactSnapshot disclaimer text

## 22. Loading, Empty, and Error States

The frontend includes page-level states for live demo reliability.

Dataset Ingestion:

- loading spinner/text while reload is running
- disabled primary button while loading
- default empty state before reload
- error card with retry button
- success panel with backend fields

Dashboard:

- loading card while fetching
- error card with retry via page reload
- fallback empty messages for distributions/top pool when arrays are empty

SmartMatch:

- loading state on run button
- empty state before match execution
- error state when match fails
- no-results state is represented by empty results after show state

AI Outreach:

- loading state on generate button
- error card for generation failure
- empty preview before generation
- fallback-used indicator when returned

Response Tracking:

- loading state while analysis runs
- visible analysis error if classification fails
- latest analysis panel after result
- response board/history update

Impact Story:

- loading state while generating
- error card
- empty state before generation
- generated output cards
- fallback-used indicator

These states reduce demo fragility and make AWS/backend behavior visible to a non-technical audience.

## 23. Responsive Design and Mobile UX

The frontend was hardened for desktop and mobile presentation.

Desktop behavior:

- fixed 280px sidebar
- expanded navigation items
- backend status card near sidebar bottom
- main content aligned with `md:pl-[280px]`
- no desktop collapse behavior

Mobile behavior:

- compact top bar
- menu button opens drawer
- drawer overlays content
- drawer closes after route selection
- cards/forms stack vertically
- key buttons become full width
- step flow scrolls horizontally
- long IDs and generated text use wrapping helpers

Global overflow controls:

- `html`, `body`, and `#root` use `overflow-x: hidden`
- `.mobile-safe-text` uses `overflow-wrap: anywhere` and `word-break: break-word`
- form controls use `max-width: 100%`

Page-level responsive patterns:

- Landing workflow cards wrap
- Dataset result fields become mobile-friendly cards
- Dashboard cards stack
- SmartMatch form fields stack and results become donor cards
- AI Outreach controls stack and buttons become easy tap targets
- Response examples wrap and analysis cards stack
- Impact Story form/output cards stack
- API Settings uses mobile cards for endpoint display and wraps long URLs/table names

## 24. Frontend Deployment

Hosting:

- AWS Amplify Hosting
- GitHub-connected deployment
- build output from Vite `dist/`

Production frontend URL:

```text
https://main.d2sj4v5ffjc9ah.amplifyapp.com
```

Amplify build config:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Frontend environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

This public API Gateway URL is not a secret. AWS credentials and secrets must never be placed in frontend source code.

Build scripts in `package.json`:

- `npm run dev` -> `vite`
- `npm run build` -> `vite build`
- `npm run preview` -> `vite preview`

## 25. Frontend Testing and Verification

Practical checks:

```bash
npm install
npm run build
```

Route checks:

- `/`
- `/dataset-ingestion`
- `/dashboard`
- `/smartmatch`
- `/ai-outreach`
- `/response-tracking`
- `/impact-story`
- `/api-settings`

Functional checks:

- API Settings shows AWS Connected Mode when `VITE_API_BASE_URL` is set
- Dataset Ingestion button calls `loadDataset`
- Dashboard loads sampled metrics
- SmartMatch returns ranked donors or visible error/no-result state
- AI Outreach returns Bedrock or fallback message
- Copy Message and Mark as Sent controls work locally
- Response Tracking classifies confirm/decline/reschedule/no response
- Impact Story generates awareness message, social post, coordinator summary, and safety notice

Responsive checks:

- 360px mobile width
- 390px mobile width
- 414px mobile width
- 768px tablet width
- 1366px/1440px desktop width
- no horizontal overflow
- mobile drawer opens/closes
- desktop sidebar remains stable

The repo currently does not define a dedicated automated frontend test script. Build and manual route/API verification are the practical MVP checks.

## 26. Frontend Limitations

Current frontend limitations:

- no production authentication UI
- no role-based coordinator dashboard yet
- no full request lifecycle workspace
- no request owner/assignee interface
- no donor profile details page yet
- no donor availability calendar
- no real WhatsApp sending UI integration
- no webhook reply inbox
- no donor-side mobile app
- no advanced map/geospatial view
- no full accessibility audit yet
- no automated unit/component/end-to-end tests in package scripts
- no production privacy/consent workflow yet
- `src/types/index.ts` is empty even though type imports exist
- no custom `vite.config.ts` is present

These limitations do not prevent the hackathon MVP demo, but they are important for production planning.

## 27. Future Frontend Enhancements

The broader roadmap is documented in:

```text
docs/FUTURE_ENHANCEMENTS.md
```

Future frontend improvements may include:

- coordinator workspace
- request lifecycle UI
- request owner/assignee controls
- donor profile detail page
- donor availability calendar
- map/heatmap view
- advanced filters/search/sorting
- notification center
- auth/RBAC screens
- audit trail UI
- campaign/community pages
- response history timeline
- consent/preference management UI
- accessibility improvements
- automated frontend tests
- stronger typed contracts in `src/types/index.ts`

These are future enhancements, not current deployed MVP features unless later implemented in the repository.

## 28. Frontend Summary

The Hemolytics frontend is a complete hackathon-ready React MVP that turns backend donor/request intelligence into a clear coordinator workflow.

It supports dataset ingestion, dashboard intelligence, donor ranking, AI-assisted outreach, response tracking, safe impact storytelling, API visibility, responsive navigation, and estimated coordination-impact visualization.

The frontend is strongest when presented as decision support and storytelling support. It helps coordinators understand data, prioritize potential donor contacts, draft safe messages, classify replies, and communicate anonymized awareness content. It is not a medical certification interface, automated donor approval system, blood safety system, or production communications platform.

Future production frontend work should focus on authentication, coordinator workspaces, request lifecycle management, donor details, availability workflows, auditability, accessibility, consent/privacy controls, and deeper operational analytics.
