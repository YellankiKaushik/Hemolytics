// ─── SmartMatch Scoring Utilities (dataset-aware) ──────
import type { Donor, BloodGroup, MatchResult } from '../types';

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula: distance between two lat/lng points in km
 */
export function haversineDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasValidLocation(donor: Donor): boolean {
    return donor.latitude !== 0 && donor.longitude !== 0 &&
        donor.latitude >= -90 && donor.latitude <= 90 &&
        donor.longitude >= -180 && donor.longitude <= 180;
}

export function hasValidBloodGroup(donor: Donor): boolean {
    return !!donor.blood_group && donor.blood_group.length > 0;
}

// ─── Derived scoring fields ─────────────────────────────

export function donorExperienceScore(donationsTillDate: number): number {
    return Math.min(1.0, donationsTillDate / 10);
}

export function engagementScore(donor: Donor): number {
    // base = 1.0 if Active else 0.3
    const base = donor.user_donation_active_status === 'Active' ? 1.0 : 0.3;

    // call_signal = min(1.0, total_calls / 10)
    const callSignal = Math.min(1.0, donor.total_calls / 10);

    // ratio_signal = max(0, min(1, 1/(1 + calls_to_donations_ratio))) if ratio > 0, else 0.5
    let ratioSignal: number;
    if (donor.calls_to_donations_ratio > 0) {
        ratioSignal = Math.max(0.0, Math.min(1.0, 1 / (1 + donor.calls_to_donations_ratio)));
    } else {
        ratioSignal = 0.5;
    }

    return (0.5 * base) + (0.2 * callSignal) + (0.3 * ratioSignal);
}

export function eligibilityScore(donor: Donor): number {
    return donor.eligibility_status === 'eligible' ? 1.0 : 0.0;
}

export function locationQualityScore(donor: Donor): number {
    return hasValidLocation(donor) ? 1.0 : 0.0;
}

export type ReengagementPriority = 'High' | 'Medium' | 'Low';

export function reengagementPriority(donor: Donor): ReengagementPriority {
    const isInactive = donor.user_donation_active_status === 'Inactive';
    const hasComment = donor.inactive_trigger_comment.length > 0;
    const hasCalls = donor.total_calls >= 1;

    if (isInactive && hasComment && hasCalls) return 'High';
    if (isInactive && !hasComment) return 'Medium';
    return 'Low';
}

export function bridgeRequestCandidate(donor: Donor): boolean {
    return !!(donor.bridge_id || donor.bridge_blood_group || donor.expected_next_transfusion_date);
}

/**
 * Recommended action based on scoring signals
 */
function getRecommendedAction(donor: Donor, distKm: number, score: number): string {
    if (score >= 80) {
        return distKm < 10
            ? `Call ${donor.name.split(' ')[0]} now — nearby, highly engaged, immediate availability`
            : `Send WhatsApp to ${donor.name.split(' ')[0]} — strong match, coordinate logistics`;
    }
    if (score >= 50) {
        return `Send outreach message to ${donor.name.split(' ')[0]} — good candidate, moderate distance`;
    }
    if (score > 0) {
        return `Add ${donor.name.split(' ')[0]} to backup list — lower engagement, check availability`;
    }
    return `Skip — excluded by hard filters`;
}

// ─── Confidence label from score and data completeness ──

export function calculateConfidenceLabel(
    score: number,
    donor: Donor,
): 'High' | 'Medium' | 'Low' | 'Excluded' {
    if (score === 0) return 'Excluded';

    // Check data completeness for confidence
    const hasDonationData = donor.donations_till_date > 0;
    const hasCallData = donor.total_calls > 0;
    const hasRatioData = donor.calls_to_donations_ratio > 0;
    const dataComplete = hasDonationData && hasCallData && hasRatioData;

    if (score >= 80 && dataComplete) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
}

// ─── Main match scoring ─────────────────────────────────

export function calculateMatchScore(
    donor: Donor,
    requiredBloodGroup: BloodGroup,
    requestLat: number,
    requestLng: number,
    requestCity: string
): { score: number; distanceKm: number; reason: string; confidence: 'High' | 'Medium' | 'Low' | 'Excluded' } {
    // Hard filter: blood group must match
    if (donor.blood_group !== requiredBloodGroup) {
        return {
            score: 0, distanceKm: 0,
            reason: `Excluded — blood group ${donor.blood_group} does not match required ${requiredBloodGroup}`,
            confidence: 'Excluded'
        };
    }
    // Hard filter: eligibility
    if (donor.eligibility_status !== 'eligible') {
        return {
            score: 0, distanceKm: 0,
            reason: `Excluded — eligibility status is ${donor.eligibility_status}`,
            confidence: 'Excluded'
        };
    }
    // Hard filter: active status
    if (donor.user_donation_active_status !== 'Active') {
        return {
            score: 0, distanceKm: 0,
            reason: `Excluded — donation active status is ${donor.user_donation_active_status}`,
            confidence: 'Excluded'
        };
    }
    // Hard filter: valid location
    if (!hasValidLocation(donor)) {
        return {
            score: 0, distanceKm: 0,
            reason: 'Excluded — missing or invalid location coordinates',
            confidence: 'Excluded'
        };
    }

    // ── Compute weighted score ──────────────────────────────
    const dist = haversineDistanceKm(requestLat, requestLng, donor.latitude, donor.longitude);
    const proximityScore = Math.max(0, 1 - dist / 50);
    const expScore = donorExperienceScore(donor.donations_till_date);
    const engScore = engagementScore(donor);
    const eligScore = eligibilityScore(donor);
    const locScore = locationQualityScore(donor);
    const cityBonus = donor.city === requestCity ? 0.15 : 0;

    // Weighted formula:
    // 30% proximity, 25% engagement, 15% experience, 15% eligibility, 15% location + city bonus
    const raw = proximityScore * 0.30
        + engScore * 0.25
        + expScore * 0.15
        + eligScore * 0.15
        + locScore * 0.15
        + (cityBonus > 0 ? 0.15 : 0);

    const score = Math.round(Math.min(1.0, raw) * 100);

    // ── Build reason string with dataset-aware fields ───────
    const distStr = `${Math.round(dist)}km away`;
    const donationsStr = `${donor.donations_till_date} donations`;
    const callsStr = `${donor.total_calls} calls`;
    const ratioStr = donor.calls_to_donations_ratio > 0
        ? `${Math.round(donor.calls_to_donations_ratio * 100)}% call ratio`
        : 'no call data';
    const engagementStr = `engagement ${Math.round(engScore * 100)}%`;
    const cityStr = donor.city === requestCity ? ', same city' : '';
    const donorTypeStr = donor.donor_type ? `, ${donor.donor_type.toLowerCase()}` : '';

    const reason = `${donor.name} — ${distStr}, ${donationsStr}, ${callsStr}, ${ratioStr}, ${engagementStr}${cityStr}${donorTypeStr}`;

    return {
        score,
        distanceKm: Math.round(dist * 10) / 10,
        reason,
        confidence: calculateConfidenceLabel(score, donor)
    };
}

/**
 * Full ranking pipeline: hard-filter → score → sort → top 5
 */
export function rankDonorsForRequest(
    donors: Donor[],
    requiredBloodGroup: BloodGroup,
    requestLat: number,
    requestLng: number,
    requestCity: string,
    requestId: string
): MatchResult[] {
    const allScored = donors.map(donor => {
        const result = calculateMatchScore(donor, requiredBloodGroup, requestLat, requestLng, requestCity);
        const eng = engagementScore(donor);
        return {
            rank: 0,
            donor_id: donor.user_id,
            donor_name: donor.name,
            blood_group: donor.blood_group,
            role: donor.role,
            distance_km: result.distanceKm,
            eligibility_status: donor.eligibility_status,
            active_status: donor.user_donation_active_status,
            donations_till_date: donor.donations_till_date,
            engagement_score: eng,
            match_score: result.score,
            confidence_label: result.confidence,
            reason: result.reason,
            recommended_action: result.score > 0 ? getRecommendedAction(donor, result.distanceKm, result.score) : 'Skip — excluded by hard filters',
            request_id: requestId,
        };
    });

    allScored.sort((a, b) => b.match_score - a.match_score);
    return allScored.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));
}
