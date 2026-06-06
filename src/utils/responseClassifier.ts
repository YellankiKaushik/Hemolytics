// ─── Response Classifier Utilities ──────────────────────
import type { ResponseStatus } from '../types';

const CONFIRM_KEYWORDS = ['yes', 'available', 'i can come', 'ok', 'sure', 'confirmed', 'coming', 'haan', 'jarur', 'theek hai', 'aata hoon', 'aajungi'];
const DECLINE_KEYWORDS = ['no', 'not possible', 'unavailable', 'cannot', 'sorry', 'nahi', 'nahin', 'nahin aa sakta', 'not today'];
const RESCHEDULE_KEYWORDS = ['later', 'tomorrow', 'after', 'evening', 'another time', 'kal', 'parson', 'baad mein', 'dubara'];

export type Intent = 'confirm' | 'decline' | 'reschedule' | 'no_response';

/**
 * Classify a donor response text into an intent category
 */
export function classifyResponseIntent(responseText: string): Intent {
    if (!responseText || responseText.trim().length === 0) return 'no_response';
    const lower = responseText.toLowerCase();

    // Check confirm first (positive signals)
    for (const kw of CONFIRM_KEYWORDS) {
        if (lower.includes(kw)) return 'confirm';
    }
    // Then decline
    for (const kw of DECLINE_KEYWORDS) {
        if (lower.includes(kw)) return 'decline';
    }
    // Then reschedule
    for (const kw of RESCHEDULE_KEYWORDS) {
        if (lower.includes(kw)) return 'reschedule';
    }

    return 'no_response';
}

/**
 * Map intent to a response status
 */
export function intentToResponseStatus(intent: Intent): ResponseStatus {
    switch (intent) {
        case 'confirm': return 'Available';
        case 'decline': return 'Unavailable';
        case 'reschedule': return 'Needs follow-up';
        case 'no_response': return 'Needs follow-up';
    }
}

/**
 * Generate a short AI summary for the response
 */
export function summarizeResponse(intent: Intent, donorName: string, responseText: string): string {
    switch (intent) {
        case 'confirm':
            return `${donorName} confirmed availability. Ready to proceed with donation.`;
        case 'decline':
            return `${donorName} is unavailable. Noted for future re-engagement.`;
        case 'reschedule':
            return `${donorName} expressed interest but needs a different time. Follow-up recommended.`;
        case 'no_response':
            return `No response received from ${donorName}. Escalation recommended.`;
    }
}

/**
 * Get suggested coordinator action based on intent
 */
export function getSuggestedCoordinatorAction(intent: Intent): string {
    switch (intent) {
        case 'confirm': return 'Share hospital details and coordinate pickup time';
        case 'decline': return 'Move to next ranked donor in the list';
        case 'reschedule': return 'Confirm alternative timing and update request';
        case 'no_response': return 'Attempt second contact or escalate to next donor';
    }
}
