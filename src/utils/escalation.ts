// ─── Escalation Logic ───────────────────────────────────
import type { MatchResult } from '../types';

export type EscalationResult = {
    action: 'donor_confirmed' | 'escalate_to_next_donor' | 'needs_follow_up' | 'needs_coordinator_attention';
    nextDonorId: string | null;
    requestStatus: string;
};

/**
 * Given the current response intent, the current donor rank, and the full ranked donor list,
 * determine the escalation action.
 */
export function determineEscalation(
    intent: 'confirm' | 'decline' | 'reschedule' | 'no_response',
    currentDonorId: string,
    rankedDonors: MatchResult[]
): EscalationResult {
    if (intent === 'confirm') {
        return {
            action: 'donor_confirmed',
            nextDonorId: null,
            requestStatus: 'donor_confirmed'
        };
    }

    // Find current donor's rank
    const currentIdx = rankedDonors.findIndex(d => d.donor_id === currentDonorId);

    if (intent === 'reschedule') {
        return {
            action: 'needs_follow_up',
            nextDonorId: null,
            requestStatus: 'needs_follow_up'
        };
    }

    // decline or no_response → try next donor
    if (currentIdx >= 0 && currentIdx < rankedDonors.length - 1) {
        const nextDonor = rankedDonors[currentIdx + 1];
        return {
            action: 'escalate_to_next_donor',
            nextDonorId: nextDonor.donor_id,
            requestStatus: 'escalated'
        };
    }

    // No more donors left
    return {
        action: 'needs_coordinator_attention',
        nextDonorId: null,
        requestStatus: 'needs_coordinator_attention'
    };
}

/**
 * Get the next ranked donor from the list (utility wrapper)
 */
export function getNextRankedDonor(currentDonorId: string, rankedDonors: MatchResult[]): MatchResult | null {
    const idx = rankedDonors.findIndex(d => d.donor_id === currentDonorId);
    if (idx >= 0 && idx < rankedDonors.length - 1) {
        return rankedDonors[idx + 1];
    }
    return null;
}

/**
 * Update request status based on a response action
 */
export function updateRequestStatusFromResponse(
    currentStatus: string,
    intent: 'confirm' | 'decline' | 'reschedule' | 'no_response',
    hasMoreDonors: boolean
): string {
    if (intent === 'confirm') return 'donor_confirmed';
    if (intent === 'reschedule') return 'needs_follow_up';
    if (intent === 'decline' || intent === 'no_response') {
        return hasMoreDonors ? 'escalated' : 'needs_coordinator_attention';
    }
    return currentStatus;
}
