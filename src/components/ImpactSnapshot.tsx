import React from 'react';
import {
    ClipboardList,
    Clock,
    Database,
    Flag,
    SearchCheck,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';

type ImpactSnapshotMetrics = {
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

type ImpactSnapshotProps = {
    metrics?: ImpactSnapshotMetrics;
    variant?: 'strong' | 'compact';
    className?: string;
    contextNote?: string;
};

const FALLBACK = {
    recordsProcessed: 7033,
    uniqueRecords: 6946,
    requestRecords: 786,
    duplicateGroupsHandled: 87,
    invalidBloodGroupsFlagged: 2036,
    missingLocationFlagged: 24,
    sampledRecords: 1000,
    activeDonors: 905,
    activeRequests: 500,
    donorProfilesPrioritized: 'Top 5',
};

function formatNumber(value: number | string | undefined) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toLocaleString();
    return 'Not available';
}

export default function ImpactSnapshot({
    metrics = {},
    variant = 'strong',
    className = '',
    contextNote,
}: ImpactSnapshotProps) {
    const recordsProcessed = metrics.recordsProcessed ?? FALLBACK.recordsProcessed;
    const uniqueRecords = metrics.uniqueRecords ?? FALLBACK.uniqueRecords;
    const requestRecords = metrics.requestRecords ?? metrics.activeRequests ?? FALLBACK.requestRecords;
    const donorProfilesPrioritized = metrics.donorProfilesPrioritized ?? FALLBACK.donorProfilesPrioritized;
    const invalidBloodGroups = metrics.invalidBloodGroupsFlagged ?? FALLBACK.invalidBloodGroupsFlagged;
    const missingLocations = metrics.missingLocationFlagged ?? FALLBACK.missingLocationFlagged;
    const duplicateGroups = metrics.duplicateGroupsHandled ?? FALLBACK.duplicateGroupsHandled;
    const dataQualityFlags = invalidBloodGroups + missingLocations;
    const coordinatorTimeSaved = metrics.coordinatorTimeSaved ?? 'Estimated';
    const sampledContext = metrics.sampledRecords
        ? `${formatNumber(metrics.sampledRecords)} sampled dashboard records support fast demo analytics${metrics.activeDonors ? `, including ${formatNumber(metrics.activeDonors)} active donors in the sample` : ''}${metrics.activeRequests ? ` and ${formatNumber(metrics.activeRequests)} sampled active/bridge requests` : ''}.`
        : `${formatNumber(FALLBACK.sampledRecords)} sampled dashboard records are used as a safe demo baseline.`;
    const workflowContext = metrics.responsesClassified
        ? `${formatNumber(metrics.responsesClassified)} responses are represented as classified coordination inputs for awareness messaging.`
        : 'SmartMatch shows the top 5 donors prioritized for coordinator review.';

    const cards = [
        {
            title: 'Records Processed',
            value: recordsProcessed,
            helper: `${formatNumber(recordsProcessed)} dataset records processed for coordination review.`,
            icon: Database,
            tone: 'bg-blue-50 text-blue-700 border-blue-100',
        },
        {
            title: 'Unique People/User Records Organized',
            value: uniqueRecords,
            helper: `${formatNumber(uniqueRecords)} unique records organized for faster coordinator review.`,
            icon: Users,
            tone: 'bg-green-50 text-green-700 border-green-100',
        },
        {
            title: 'Request Records Identified',
            value: requestRecords,
            helper: `${formatNumber(requestRecords)} request records identified from the dataset.`,
            icon: ClipboardList,
            tone: 'bg-red-50 text-red-700 border-red-100',
        },
        {
            title: 'Donor Profiles Prioritized',
            value: donorProfilesPrioritized,
            helper: 'SmartMatch ranks donors to contact first, not guaranteed available donors.',
            icon: SearchCheck,
            tone: 'bg-purple-50 text-purple-700 border-purple-100',
        },
        {
            title: 'Data Quality Flags',
            value: dataQualityFlags,
            helper: `${formatNumber(invalidBloodGroups)} blood group flags, ${formatNumber(missingLocations)} missing locations, ${formatNumber(duplicateGroups)} duplicate groups handled.`,
            icon: Flag,
            tone: 'bg-amber-50 text-amber-800 border-amber-100',
        },
        {
            title: 'Coordinator Time Saved',
            value: coordinatorTimeSaved,
            helper: 'AI Outreach creates coordinator-ready copy; final verification remains human-led.',
            icon: Clock,
            tone: 'bg-slate-50 text-slate-700 border-slate-200',
        },
    ];

    return (
        <section className={`bg-white rounded-xl border border-gray-100 shadow-sm ${variant === 'compact' ? 'p-4' : 'p-5 sm:p-6'} ${className}`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={17} className="text-[var(--brand-primary)] flex-shrink-0" />
                        <h2 className={`${variant === 'compact' ? 'text-base' : 'text-lg'} font-bold text-gray-900`} style={{ fontFamily: 'Space Grotesk' }}>
                            Estimated Impact Snapshot
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-3xl">
                        Based on loaded Blood Warriors dataset records and coordinator workflow activity. These are coordination-support metrics, not medical outcome claims.
                    </p>
                    {contextNote && (
                        <p className="text-xs text-gray-400 mt-1 mobile-safe-text">{contextNote}</p>
                    )}
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                    <ShieldCheck size={14} className="flex-shrink-0" />
                    <span className="mobile-safe-text">Estimated coordination indicators only</span>
                </div>
            </div>

            <div className={`grid grid-cols-1 xs:grid-cols-2 ${variant === 'compact' ? 'lg:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3'} gap-3`}>
                {cards.map(card => (
                    <div key={card.title} className={`rounded-xl border p-4 min-w-0 ${card.tone}`}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                                <card.icon size={18} />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-right mobile-safe-text" style={{ fontFamily: 'Space Grotesk' }}>
                                {formatNumber(card.value)}
                            </div>
                        </div>
                        <div className="text-xs font-semibold leading-snug mobile-safe-text">{card.title}</div>
                        <div className="text-[11px] opacity-80 mt-1 leading-relaxed mobile-safe-text">{card.helper}</div>
                    </div>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-gray-600 mobile-safe-text">
                    {sampledContext}
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-gray-600 mobile-safe-text">
                    {workflowContext}
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-gray-600 mobile-safe-text">
                    Impact metrics are estimated coordination indicators, not confirmed medical outcomes.
                </div>
            </div>
        </section>
    );
}
