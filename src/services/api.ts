// ─── Hemolytics API Service ─────────────────────────────
// Mock Mode: VITE_API_BASE_URL is empty → all logic runs client-side
// AWS Connected Mode: VITE_API_BASE_URL is set → calls real backend

import { API_BASE_URL, IS_AWS_CONNECTED, AWS_REGION, BEDROCK_MODEL_ID, API_ENDPOINTS } from '../config/apiConfig';
import { donors, bloodRequests, dashboardMetrics, cleaningSummary, donorResponses } from '../data/mockData';
import { rankDonorsForRequest } from '../utils/scoring';
import { classifyResponseIntent, summarizeResponse, getSuggestedCoordinatorAction, intentToResponseStatus } from '../utils/responseClassifier';
import { determineEscalation, updateRequestStatusFromResponse } from '../utils/escalation';
import type { BloodGroup, MatchResult, Donor, DonorResponse, ResponseStatus } from '../types';

// ─── Generic fetch helper ───────────────────────────────
async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
}

// ─── 1. Health Check ────────────────────────────────────
export async function getHealth() {
    if (!IS_AWS_CONNECTED) {
        return {
            status: 'healthy',
            app: 'Hemolytics',
            mode: 'mock',
            awsRegion: AWS_REGION,
            architecture: 'React + API Gateway + Lambda + DynamoDB + Bedrock + S3 + CloudWatch',
        };
    }
    return apiFetch<{ status: string;[k: string]: unknown }>('GET', API_ENDPOINTS.health);
}

// ─── 2. Dashboard Metrics ──────────────────────────────
export async function getDashboard() {
    if (!IS_AWS_CONNECTED) {
        return {
            totalRecords: dashboardMetrics.total_records_loaded,
            uniqueUsers: dashboardMetrics.unique_users,
            totalDonorLikeUsers: dashboardMetrics.donor_like_users,
            activeDonors: dashboardMetrics.active_donors,
            inactiveDonors: dashboardMetrics.inactive_donors,
            eligibleDonors: dashboardMetrics.eligible_donors,
            notEligibleDonors: dashboardMetrics.not_eligible_donors,
            missingBloodGroup: dashboardMetrics.missing_blood_group_count,
            missingLocation: dashboardMetrics.missing_location_count,
            locationCoveragePercent: dashboardMetrics.location_coverage_pct,
            reengagementCandidates: dashboardMetrics.reengagement_candidates,
            activeBridgeCount: dashboardMetrics.active_bridge_request_count,
            bloodGroupDistribution: [
                { group: 'O Positive', count: 3 },
                { group: 'A Positive', count: 3 },
                { group: 'B Positive', count: 1 },
                { group: 'AB Positive', count: 1 },
                { group: 'O Negative', count: 1 },
                { group: 'B Negative', count: 1 },
                { group: 'Bombay Blood Group', count: 1 },
            ],
            roleDistribution: [
                { role: 'Donor', count: 10 },
                { role: 'Coordinator', count: 1 },
            ],
            topEligibleDonorPool: donors
                .filter(d => d.eligibility_status === 'eligible' && d.user_donation_active_status === 'Active')
                .slice(0, 5),
            recentActivity: [
                { time: '09:45', event: 'Vikram Singh confirmed for REQ-001', type: 'confirmed' },
                { time: '09:30', event: 'SmartMatch ranked top 5 donors for REQ-001', type: 'match' },
                { time: '09:15', event: 'Outreach messages sent to 3 donors', type: 'outreach' },
                { time: '09:00', event: 'REQ-001 created — O Positive Critical in Hyderabad', type: 'request' },
                { time: '08:45', event: 'Dataset ingestion completed — 12 records loaded', type: 'system' },
            ],
        };
    }
    return apiFetch<Record<string, unknown>>('GET', API_ENDPOINTS.dashboard);
}

// ─── 3. Dataset Ingestion ──────────────────────────────
export async function loadDataset() {
    if (!IS_AWS_CONNECTED) {
        // Simulate CSV → S3 → Lambda datasetLoader → DynamoDB pipeline
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            rowsLoaded: cleaningSummary.total_rows,
            uniqueUsersCreated: cleaningSummary.unique_users,
            duplicateGroupsHandled: cleaningSummary.duplicate_user_ids,
            donorsWrittenToHemolyticsDonors: cleaningSummary.donor_profiles_created,
            requestsWrittenToHemolyticsRequests: cleaningSummary.bridge_request_candidates,
            invalidBloodGroupsFlagged: cleaningSummary.missing_blood_groups,
            missingLocationFlagged: cleaningSummary.missing_locations,
            loadStatus: 'completed',
            timestamp: new Date().toISOString(),
        };
    }
    return apiFetch<Record<string, unknown>>('POST', API_ENDPOINTS.loadDataset);
}

// ─── 4. SmartMatch ─────────────────────────────────────
interface MatchRequest {
    requestId: string;
    requiredBloodGroup: BloodGroup;
    latitude: number;
    longitude: number;
    city: string;
    urgency: string;
    quantityRequired: number;
    neededBy: string;
}

export async function runSmartMatch(request: MatchRequest): Promise<{
    results: MatchResult[];
    matchTimeMs: number;
    totalCandidates: number;
    eligibleCandidates: number;
}> {
    if (!IS_AWS_CONNECTED) {
        const start = performance.now();
        const results = rankDonorsForRequest(
            donors,
            request.requiredBloodGroup,
            request.latitude,
            request.longitude,
            request.city,
            request.requestId
        );
        const matchTimeMs = Math.round(performance.now() - start);
        const eligibleCandidates = donors.filter(
            d => d.eligibility_status === 'eligible' && d.user_donation_active_status === 'Active'
        ).length;
        return { results, matchTimeMs, totalCandidates: donors.length, eligibleCandidates };
    }
    return apiFetch<{ results: MatchResult[]; matchTimeMs: number; totalCandidates: number; eligibleCandidates: number }>(
        'POST', API_ENDPOINTS.match, request
    );
}

// ─── 5. AI Outreach ────────────────────────────────────
interface OutreachContext {
    donor: Donor;
    request: { request_id: string; required_blood_group: BloodGroup; city: string; urgency: string; quantity_required: number };
    tone: string;
    language: string;
    coordinatorPersona: string;
}

export async function generateOutreachMessage(context: OutreachContext): Promise<{
    message: string;
    model: string;
    provider: string;
    safetyNotice: string;
    conversationId: string;
}> {
    if (!IS_AWS_CONNECTED) {
        // Generate a Bedrock-style message locally
        const { donor, request, tone, language } = context;
        const msg = generateLocalMessage(donor, request, tone, language);
        return {
            message: msg,
            model: BEDROCK_MODEL_ID,
            provider: 'AWS Bedrock',
            safetyNotice: 'AI-assisted message only. No medical claims. No donor health certification.',
            conversationId: `conv-${Date.now()}`,
        };
    }
    return apiFetch<{ message: string; model: string; provider: string; safetyNotice: string; conversationId: string }>(
        'POST', API_ENDPOINTS.chat, context
    );
}

function generateLocalMessage(donor: Donor, req: { required_blood_group: BloodGroup; city: string; urgency: string }, tone: string, language: string): string {
    const name = donor.name.split(' ')[0];
    const bg = req.required_blood_group;
    const city = req.city;
    const urgency = req.urgency;

    if (language === 'Hindi') {
        const msgs: Record<string, string> = {
            'urgent': `ZAROORI: ${name} ji, ${city} mein ${bg} blood ki ${urgency.toLowerCase()} zarurat hai. Kya aap aaj help kar sakte hain? — Priya, Blood Warriors`,
            'empathetic': `Namaskar ${name} ji, ${city} mein ek patient ko ${bg} blood ki zarurat hai. Agar available hain toh kripya batayein. — Priya, Blood Warriors`,
            'short SMS': `${bg} zarurat hai ${city} mein. Help kar sakte hain? YES ya NO jawab dein. — Blood Warriors`,
            'WhatsApp-style': `Namaskar ${name} ji! 🙏\n\nBlood Warriors ki taraf se message hai. ${city} mein ${bg} blood ki ${urgency.toLowerCase()} zarurat hai.\n\nKya aap aaj help kar sakte hain? 🩸\n\n— Priya, Blood Warriors Coordinator`,
            'formal coordinator message': `Maniya ${name} ji,\n\nBlood Warriors se Priya. ${city} mein ${bg} blood ki ${urgency.toLowerCase()} zarurat hai.\n\nKripya apni uplabdhata confirm karein.\n\nSadar, Priya — Blood Warriors`,
        };
        return msgs[tone] || msgs['WhatsApp-style'];
    }

    const msgs: Record<string, string> = {
        'urgent': `URGENT: ${name}, we need ${bg} blood in ${city} as soon as possible. This is a ${urgency.toLowerCase()} request. Can you help today? — Priya, Blood Warriors`,
        'empathetic': `Dear ${name},\n\nWe hope you're doing well. A patient in ${city} needs ${bg} blood. If you're available, we'd be grateful. No pressure.\n\nWith gratitude, Priya — Blood Warriors`,
        'short SMS': `${bg} needed in ${city}. Can you help? Reply YES or NO. — Blood Warriors`,
        'WhatsApp-style': `Hi ${name}! 🙏\n\nBlood Warriors here. We have a ${urgency.toLowerCase()} request for ${bg} blood in ${city}.\n\nCan you help today? 🩸\n\n— Priya, Blood Warriors Coordinator`,
        'formal coordinator message': `Dear ${name},\n\nThis is Priya from Blood Warriors. We are reaching out regarding a ${urgency.toLowerCase()} blood requirement for ${bg} in ${city}.\n\nPlease confirm your availability.\n\nRegards,\nPriya\nBlood Warriors Coordinator`,
    };
    return msgs[tone] || msgs['WhatsApp-style'];
}

// ─── 6. Donor Response ─────────────────────────────────
interface ResponsePayload {
    requestId: string;
    donorId: string;
    responseText: string;
    currentRank: number;
    rankedDonors: MatchResult[];
}

export async function submitDonorResponse(payload: ResponsePayload): Promise<{
    detectedIntent: string;
    responseStatus: string;
    aiSummary: string;
    nextAction: string;
    escalationTriggered: boolean;
    nextDonorId: string | null;
    updatedRequestStatus: string;
}> {
    if (!IS_AWS_CONNECTED) {
        const intent = classifyResponseIntent(payload.responseText);
        const status = intentToResponseStatus(intent);
        const summary = summarizeResponse(intent, payload.donorId, payload.responseText);
        const nextAction = getSuggestedCoordinatorAction(intent);
        const escalation = determineEscalation(intent, payload.donorId, payload.rankedDonors);
        const hasMoreDonors = payload.currentRank < payload.rankedDonors.length;
        const updatedStatus = updateRequestStatusFromResponse('open', intent, hasMoreDonors);

        return {
            detectedIntent: intent,
            responseStatus: status,
            aiSummary: summary,
            nextAction,
            escalationTriggered: escalation.action === 'escalate_to_next_donor',
            nextDonorId: escalation.nextDonorId,
            updatedRequestStatus: updatedStatus,
        };
    }
    return apiFetch<Record<string, unknown>>('POST', API_ENDPOINTS.response, payload);
}

// ─── 7. Impact Story ───────────────────────────────────
interface ImpactPayload {
    donorsContacted: number;
    responsesReceived: number;
    potentialMatches: number;
    campaignCity: string;
    bloodGroup: string;
    patientSafeContext: string;
    tone: string;
}

export async function generateImpactStory(payload: ImpactPayload): Promise<{
    awarenessMessage: string;
    socialPost: string;
    coordinatorSummary: string;
    safetyNotice: string;
}> {
    if (!IS_AWS_CONNECTED) {
        const { donorsContacted, responsesReceived, potentialMatches, campaignCity, bloodGroup, tone } = payload;
        const matchRate = donorsContacted > 0 ? Math.round((responsesReceived / donorsContacted) * 100) : 0;

        const awareness = `Every 2 minutes, someone in India needs blood. In ${campaignCity}, our ${bloodGroup} donation drive reached ${donorsContacted} community members, with ${responsesReceived} stepping forward to help.\n\nThalassemia patients need regular transfusions — sometimes every 2–3 weeks. Your single donation can give someone weeks of hope.\n\nNo medical claims. No guarantees. Just community showing up.\n\n#BloodDonation #${bloodGroup.replace(/\s/g, '')} #${campaignCity}BloodWarriors`;

        const social = `🩸 ${campaignCity} Blood Drive Update\n\n${donorsContacted} people reached\n${responsesReceived} showed up to help\n${potentialMatches} potential life-savers identified\n\nOne donation = one family's hope.\n\nIf you're ${bloodGroup} and in ${campaignCity}, you might be someone's hero today.\n\nDM us to join. No pressure. No medical claims. Just community. 🤝\n\n#BloodWarriors #${campaignCity}Donates #ThalassemiaAwareness`;

        const coordinator = `CAMPAIGN SUMMARY — ${campaignCity}\nBlood Group Focus: ${bloodGroup}\n\nDonors Contacted: ${donorsContacted}\nResponses Received: ${responsesReceived} (${matchRate}% response rate)\nPotential Matches Found: ${potentialMatches}\n\nAll data is anonymized. No patient PII included.`;

        return {
            awarenessMessage: awareness,
            socialPost: social,
            coordinatorSummary: coordinator,
            safetyNotice: 'All content follows safe messaging rules. No patient PII. No medical claims. No guaranteed survival statements.',
        };
    }
    return apiFetch<Record<string, unknown>>('POST', API_ENDPOINTS.impactStory, payload);
}
