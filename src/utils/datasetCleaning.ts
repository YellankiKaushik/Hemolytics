// ─── Dataset Cleaning Utilities (dataset-aware) ────────
import type { BloodGroup, Donor } from '../types';

const VALID_BLOOD_GROUPS: BloodGroup[] = [
    'A Positive', 'B Positive', 'O Positive', 'AB Positive',
    'O Negative', 'B Negative', 'A Negative', 'AB Negative', 'Bombay Blood Group'
];

/**
 * Normalize various blood group notations to our canonical format
 */
export function normalizeBloodGroup(raw: string): BloodGroup | null {
    if (!raw || raw.trim().length === 0) return null;
    const clean = raw.trim().toLowerCase();
    const map: Record<string, BloodGroup> = {
        'a+': 'A Positive', 'a positive': 'A Positive',
        'b+': 'B Positive', 'b positive': 'B Positive',
        'o+': 'O Positive', 'o positive': 'O Positive',
        'ab+': 'AB Positive', 'ab positive': 'AB Positive',
        'a-': 'A Negative', 'a negative': 'A Negative',
        'b-': 'B Negative', 'b negative': 'B Negative',
        'o-': 'O Negative', 'o negative': 'O Negative',
        'ab-': 'AB Negative', 'ab negative': 'AB Negative',
        'bombay': 'Bombay Blood Group', 'bombay blood group': 'Bombay Blood Group',
    };
    return map[clean] || null;
}

/**
 * Safely parse a date string, returning null on failure
 */
export function parseSafeDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim().length === 0) return null;
    try {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

export function normalizeActiveStatus(raw: string): 'Active' | 'Inactive' | 'Unknown' {
    if (!raw) return 'Unknown';
    const clean = raw.trim().toLowerCase();
    if (clean === 'active') return 'Active';
    if (clean === 'inactive') return 'Inactive';
    return 'Unknown';
}

export function normalizeEligibilityStatus(raw: string): 'eligible' | 'not_eligible' | 'pending' | 'unknown' {
    if (!raw) return 'unknown';
    const clean = raw.trim().toLowerCase();
    if (clean === 'eligible') return 'eligible';
    if (clean === 'not eligible' || clean === 'not_eligible') return 'not_eligible';
    if (clean === 'pending') return 'pending';
    return 'unknown';
}

export function validateCoordinates(lat: number, lng: number): boolean {
    return (
        typeof lat === 'number' && typeof lng === 'number' &&
        !isNaN(lat) && !isNaN(lng) &&
        lat !== 0 && lng !== 0 &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

// ─── Derived scoring fields ─────────────────────────────

export function deriveBloodGroup(raw: string): BloodGroup | null {
    return normalizeBloodGroup(raw);
}

export function deriveHasValidLocation(lat: number, lng: number): boolean {
    return validateCoordinates(lat, lng);
}

export function deriveIsMatchEligible(donor: Pick<Donor, 'blood_group' | 'eligibility_status' | 'user_donation_active_status' | 'latitude' | 'longitude'>): boolean {
    return (
        !!donor.blood_group &&
        donor.blood_group.length > 0 &&
        donor.eligibility_status === 'eligible' &&
        donor.user_donation_active_status === 'Active' &&
        validateCoordinates(donor.latitude, donor.longitude)
    );
}

export function deriveDonorExperienceScore(donationsTillDate: number): number {
    return Math.min(1.0, donationsTillDate / 10);
}

export function deriveEngagementScore(donor: {
    user_donation_active_status: string;
    total_calls: number;
    calls_to_donations_ratio: number;
}): number {
    const base = donor.user_donation_active_status === 'Active' ? 1.0 : 0.3;
    const callSignal = Math.min(1.0, donor.total_calls / 10);
    let ratioSignal: number;
    if (donor.calls_to_donations_ratio > 0) {
        ratioSignal = Math.max(0.0, Math.min(1.0, 1 / (1 + donor.calls_to_donations_ratio)));
    } else {
        ratioSignal = 0.5;
    }
    return (0.5 * base) + (0.2 * callSignal) + (0.3 * ratioSignal);
}

export function deriveEligibilityScore(eligibilityStatus: string): number {
    return eligibilityStatus === 'eligible' ? 1.0 : 0.0;
}

export function deriveLocationQualityScore(lat: number, lng: number): number {
    return validateCoordinates(lat, lng) ? 1.0 : 0.0;
}

export type ReengagementPriority = 'High' | 'Medium' | 'Low';

export function deriveReengagementPriority(donor: {
    user_donation_active_status: string;
    inactive_trigger_comment: string;
    total_calls: number;
}): ReengagementPriority {
    const isInactive = donor.user_donation_active_status === 'Inactive';
    const hasComment = donor.inactive_trigger_comment.length > 0;
    const hasCalls = donor.total_calls >= 1;

    if (isInactive && hasComment && hasCalls) return 'High';
    if (isInactive && !hasComment) return 'Medium';
    return 'Low';
}

export function deriveBridgeRequestCandidate(donor: {
    bridge_id: string;
    bridge_blood_group: string;
    expected_next_transfusion_date: string;
}): boolean {
    return !!(donor.bridge_id || donor.bridge_blood_group || donor.expected_next_transfusion_date);
}

// ─── Full derive function for a raw CSV record ──────────

export function deriveDonorFields(raw: Record<string, string>) {
    const bloodGroup = normalizeBloodGroup(raw.blood_group || raw.bloodGroup || '');
    const city = (raw.city || raw.City || '').trim();
    const lat = parseFloat(raw.latitude || raw.lat || '0');
    const lng = parseFloat(raw.longitude || raw.lng || raw.lon || '0');
    const activeStatus = normalizeActiveStatus(raw.active_status || raw.user_donation_active_status || '');
    const eligibility = normalizeEligibilityStatus(raw.eligibility_status || '');
    const totalCalls = parseInt(raw.total_calls || '0', 10) || 0;
    const callsToDonationsRatio = parseFloat(raw.calls_to_donations_ratio || '0') || 0;
    const donationsTillDate = parseInt(raw.donations_till_date || raw.donation_count || '0', 10) || 0;
    const bridgeId = raw.bridge_id || '';
    const bridgeBloodGroup = raw.bridge_blood_group || '';
    const expectedNextTransfusion = raw.expected_next_transfusion_date || '';
    const inactiveTriggerComment = raw.inactive_trigger_comment || '';

    const eng = deriveEngagementScore({
        user_donation_active_status: activeStatus,
        total_calls: totalCalls,
        calls_to_donations_ratio: callsToDonationsRatio,
    });

    return {
        bloodGroup,
        hasBloodGroup: bloodGroup !== null,
        city,
        hasCity: city.length > 0,
        latitude: lat,
        longitude: lng,
        hasValidCoords: validateCoordinates(lat, lng),
        activeStatus,
        eligibility,
        donationsTillDate,
        totalCalls,
        callsToDonationsRatio,
        engagementScore: Math.min(1, Math.max(0, eng)),
        experienceScore: deriveDonorExperienceScore(donationsTillDate),
        eligibilityScore: deriveEligibilityScore(eligibility),
        locationQualityScore: deriveLocationQualityScore(lat, lng),
        reengagementPriority: deriveReengagementPriority({
            user_donation_active_status: activeStatus,
            inactive_trigger_comment: inactiveTriggerComment,
            total_calls: totalCalls,
        }),
        bridgeRequestCandidate: deriveBridgeRequestCandidate({
            bridge_id: bridgeId,
            bridge_blood_group: bridgeBloodGroup,
            expected_next_transfusion_date: expectedNextTransfusion,
        }),
        isMatchEligible: bloodGroup !== null && eligibility === 'eligible' &&
            activeStatus === 'Active' && validateCoordinates(lat, lng),
    };
}

/**
 * Summarize cleaning results from a batch of raw records
 */
export function summarizeCleaningResults(records: Record<string, string>[]) {
    const seen = new Set<string>();
    let duplicates = 0;
    let missingBloodGroups = 0;
    let missingLocations = 0;
    let invalidCoords = 0;
    let validDonors = 0;

    for (const row of records) {
        const id = row.user_id || row.userId || '';
        if (seen.has(id)) { duplicates++; } else { seen.add(id); }

        const fields = deriveDonorFields(row);
        if (!fields.hasBloodGroup) missingBloodGroups++;
        if (!fields.hasCity) missingLocations++;
        if (!fields.hasValidCoords) invalidCoords++;
        if (fields.hasBloodGroup && fields.hasCity && fields.hasValidCoords) validDonors++;
    }

    return {
        totalRows: records.length,
        uniqueUsers: seen.size,
        duplicateGroups: duplicates,
        missingBloodGroups,
        missingLocations,
        invalidCoordinates: invalidCoords,
        validDonors,
        dateParsingCompleted: true,
    };
}
