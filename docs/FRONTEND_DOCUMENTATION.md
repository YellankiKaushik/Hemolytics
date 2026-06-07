# Hemolytics Frontend Documentation

## Overview

The Hemolytics frontend is a React + Vite + Tailwind single page application. It is hosted through AWS Amplify and connects to the deployed AWS backend when `VITE_API_BASE_URL` is set.

## Frontend Stack

- React
- React DOM
- React Router DOM
- Zustand
- Lucide React
- Vite
- TypeScript source files
- Tailwind CSS
- PostCSS and Autoprefixer

Build output:

```text
dist/
```

## Entry Points

`src/main.tsx`:

- Imports global CSS from `src/index.css`
- Renders `<App />`

`src/App.tsx`:

- Wraps the app in `BrowserRouter`
- Defines route mapping
- Uses `Layout` as the shared app shell

## Routes

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `Landing` | Judge-friendly project landing page |
| `/dashboard` | `Dashboard` | Donor/request analytics |
| `/dataset-ingestion` | `DatasetIngestion` | Reload S3 dataset into DynamoDB |
| `/dataset` | redirect | Alias to dataset ingestion |
| `/smartmatch` | `SmartMatch` | Donor ranking |
| `/ai-outreach` | `AiOutreach` | Bedrock-backed outreach drafting |
| `/outreach` | redirect | Alias to AI outreach |
| `/response-tracking` | `ResponseTracking` | Intent classification and escalation |
| `/responses` | redirect | Alias to response tracking |
| `/impact-story` | `ImpactStory` | Anonymized awareness content |
| `/impact` | redirect | Alias to impact story |
| `/api-settings` | `ApiSettings` | AWS/API visibility |

## Layout

`src/components/Layout.tsx` provides:

- Fixed 280px desktop sidebar
- Mobile top bar
- Mobile drawer navigation
- Active route highlighting
- Backend status card
- Safety banner
- Step flow indicator
- Responsive content wrapper

Desktop sidebar behavior:

- Always expanded
- Fixed on the left
- Main content uses `md:pl-[280px]`

Mobile behavior:

- Desktop sidebar is hidden
- Drawer opens over content
- Drawer closes after navigation

## Styling

Tailwind is configured through:

- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css`

`src/index.css` includes Tailwind directives and custom helper classes. Notable helpers include mobile-safe wrapping behavior for long text.

The UI uses a healthcare-oriented red/navy/neutral palette with consistent cards, badges, safety notices, and responsive grids.

## API Configuration

`src/config/apiConfig.ts` reads:

```text
VITE_API_BASE_URL
```

If set, the app enters AWS Connected Mode. If absent, the app enters Mock Mode.

Current production value:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Important: this is not a secret. It should be set in Amplify environment variables or local `.env.local`, not hardcoded into application logic.

## API Client

`src/services/api.ts` exports:

- `getHealth`
- `getDashboard`
- `loadDataset`
- `runSmartMatch`
- `generateOutreachMessage`
- `submitDonorResponse`
- `generateImpactStory`

When AWS connected, each function calls the matching API Gateway route. When not connected, the service returns mock data or uses local utility functions.

## Pages

### Landing

`src/pages/Landing.tsx`

- Explains Hemolytics for first-time users and judges
- Shows MVP workflow
- Shows architecture badge
- Includes safety principle
- Includes future roadmap clearly marked as future work

### Dashboard

`src/pages/Dashboard.tsx`

- Calls `getDashboard`
- Displays donor network, dataset quality, request pipeline, and re-engagement blocks
- Shows sampled dashboard note
- Displays blood group distribution, role snapshot, recent activity, and top donor preview

### Dataset Ingestion

`src/pages/DatasetIngestion.tsx`

- Calls `loadDataset`
- Presents S3 reload flow
- Displays live backend response fields
- Avoids implying browser CSV upload to S3
- Shows loading, success, and error states

### SmartMatch

`src/pages/SmartMatch.tsx`

- Collects match request fields
- Calls `runSmartMatch`
- Displays top ranked donors as responsive cards
- Includes safety note that ranking is for coordinator review only

### AI Outreach

`src/pages/AiOutreach.tsx`

- Calls `generateOutreachMessage`
- Displays Priya coordinator persona
- Offers tone/language controls
- Supports copy and "Mark as Sent" local UI state
- Clarifies WhatsApp-style is a tone, not a production integration

### Response Tracking

`src/pages/ResponseTracking.tsx`

- Calls `submitDonorResponse`
- Shows latest analysis panel
- Displays detected intent, response status, escalation flag, next donor, summary, and next action
- Updates visible response board state

### Impact Story

`src/pages/ImpactStory.tsx`

- Calls `generateImpactStory`
- Displays awareness message, social post, coordinator summary, safety notice, and fallback status
- Avoids patient PII and medical outcome claims

### API Settings

`src/pages/ApiSettings.tsx`

- Shows AWS Connected Mode or Mock Mode
- Shows API base URL
- Lists endpoints and DynamoDB tables
- Displays architecture and model configuration

## State Management

`src/store/useAppStore.ts` uses Zustand for lightweight shared state:

- Sidebar state
- Active request ID
- Selected donor ID
- Dataset loaded flag
- Current workflow step

Observed note: after the layout simplification, the store's sidebar state appears to be legacy/unconsumed by the current `Layout.tsx` desktop/mobile drawer logic.

## Mock Data and Local Utilities

`src/data/mockData.ts` provides demo data when AWS is not connected.

Utilities:

- `datasetCleaning.ts`
- `scoring.ts`
- `responseClassifier.ts`
- `escalation.ts`
- `formatters.ts`

These keep local mock behavior aligned with backend concepts.

## Build and Run

Install:

```bash
npm install
```

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

## Amplify Deployment

`amplify.yml`:

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

Set in Amplify:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

## Frontend Limitations

- No authentication UI is implemented.
- No role-based routing is implemented.
- No full TypeScript type-check script is present in `package.json`.
- `src/types/index.ts` appears incomplete or empty while type imports exist.
- No automated component or end-to-end tests were found.
- Browser upload to S3 is intentionally not implemented.
- WhatsApp sending is intentionally not implemented.

## Not Applicable

- Server-side rendering
- Next.js routing
- React Native/mobile app build
- WebSocket UI
- Production auth/session management
- Payment or billing UI

