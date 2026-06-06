// ─── API Configuration ──────────────────────────────────
// Mock Mode: VITE_API_BASE_URL is empty → run entirely client-side
// AWS Connected Mode: VITE_API_BASE_URL is set → call real backend

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const IS_AWS_CONNECTED: boolean = API_BASE_URL.length > 0;
export const AWS_REGION = "us-east-1";
export const BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export const API_ENDPOINTS = {
    health: "/health",
    dashboard: "/dashboard",
    match: "/match",
    chat: "/chat",
    response: "/response",
    impactStory: "/impact-story",
    loadDataset: "/load-dataset",
} as const;
