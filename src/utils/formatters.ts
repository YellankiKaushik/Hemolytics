// ─── Formatting Utilities ───────────────────────────────
import type { BloodGroup } from '../types';

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format a date with time for display
 */
export function formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format distance in km
 */
export function formatDistance(km: number): string {
    if (km === 0) return '—';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
}

/**
 * Format a score (0-100) with percentage
 */
export function formatScore(score: number): string {
    return `${Math.round(score)}%`;
}

/**
 * Format a blood group for display (already human-readable, but normalize)
 */
export function formatBloodGroup(bg: BloodGroup): string {
    return bg;
}

/**
 * Format a status label for display
 */
export function formatStatusLabel(status: string): string {
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format a number with Indian locale
 */
export function formatNumber(n: number): string {
    return n.toLocaleString('en-IN');
}
