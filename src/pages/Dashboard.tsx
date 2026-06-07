import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/api';
import {
    Activity, AlertTriangle, ArrowRight, Database, Droplets,
    Loader2, MapPin, RefreshCw, Shield, UserCheck, Users
} from 'lucide-react';

const activityTypeColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    match: 'bg-blue-100 text-blue-700',
    outreach: 'bg-purple-100 text-purple-700',
    request: 'bg-red-100 text-red-700',
    system: 'bg-gray-100 text-gray-600',
};

function metricNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
}

function MetricBlock({ title, subtitle, icon: Icon, tone, metrics }: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    tone: string;
    metrics: { label: string; value: string | number; helper?: string }[];
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}>
                    <Icon size={19} />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                {metrics.map(item => (
                    <div key={item.label} className="rounded-lg bg-gray-50 border border-gray-100 p-3 min-w-0">
                        <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{item.value}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{item.label}</div>
                        {item.helper && <div className="text-[10px] text-gray-400 mt-1">{item.helper}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDashboard()
            .then(data => setMetrics(data))
            .catch(err => setError(err.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 size={32} className="mx-auto animate-spin text-[var(--brand-primary)] mb-3" />
                    <p className="text-sm text-gray-500">Loading dashboard metrics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 lg:p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-400 mb-3" />
                    <p className="text-sm text-red-700 font-medium">Dashboard Unavailable</p>
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition">Retry</button>
                </div>
            </div>
        );
    }

    const m = metrics || {};
    const totalRecords = metricNumber(m.totalRecords);
    const uniqueUsers = metricNumber(m.uniqueUsers);
    const donorLikeUsers = metricNumber(m.totalDonorLikeUsers);
    const activeDonors = metricNumber(m.activeDonors);
    const inactiveDonors = metricNumber(m.inactiveDonors);
    const eligibleDonors = metricNumber(m.eligibleDonors);
    const notEligibleDonors = metricNumber(m.notEligibleDonors);
    const missingBloodGroup = metricNumber(m.missingBloodGroup);
    const missingLocation = metricNumber(m.missingLocation);
    const locationCoverage = metricNumber(m.locationCoveragePercent);
    const reengagement = metricNumber(m.reengagementCandidates);
    const activeBridge = metricNumber(m.activeBridgeCount);
    const sampledRecords = metricNumber(m.sampledRecords) || totalRecords;
    const dashboardMode = (m.dashboardMode as string) || 'sampled';
    const bgDist = (m.bloodGroupDistribution as { group: string; count: number }[]) || [];
    const roleDist = (m.roleDistribution as { role: string; count: number }[]) || [];
    const topPool = ((m.topEligibleDonorPool as Record<string, unknown>[]) || []).slice(0, 10);
    const activity = (m.recentActivity as { time: string; event: string; type: string }[]) || [];

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                        Donor Intelligence Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        A fast coordinator view of donor network readiness, dataset quality, active requests, and re-engagement opportunities.
                    </p>
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3 inline-flex leading-relaxed">
                        Dashboard uses a fast sample of donor records for demo-speed analytics.
                    </p>
                </div>
                <button onClick={() => navigate('/smartmatch')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition">
                    Run SmartMatch <ArrowRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricBlock
                    title="Donor Network"
                    subtitle="Who can coordinators reach?"
                    icon={Users}
                    tone="bg-blue-50 text-blue-600"
                    metrics={[
                        { label: 'Records sampled', value: sampledRecords },
                        { label: 'Unique users', value: uniqueUsers },
                        { label: 'Donor-like users', value: donorLikeUsers },
                        { label: 'Active donors', value: activeDonors },
                    ]}
                />
                <MetricBlock
                    title="Dataset Quality"
                    subtitle="Can SmartMatch use the data?"
                    icon={Database}
                    tone="bg-purple-50 text-purple-600"
                    metrics={[
                        { label: 'Location coverage', value: `${locationCoverage}%` },
                        { label: 'Missing location', value: missingLocation },
                        { label: 'Missing blood group', value: missingBloodGroup },
                        { label: 'Dashboard mode', value: dashboardMode },
                    ]}
                />
                <MetricBlock
                    title="Request Pipeline"
                    subtitle="Current bridge/request pressure"
                    icon={Activity}
                    tone="bg-red-50 text-red-600"
                    metrics={[
                        { label: 'Active requests', value: activeBridge },
                        { label: 'Eligible donors', value: eligibleDonors },
                        { label: 'Not eligible', value: notEligibleDonors },
                        { label: 'Sample size', value: totalRecords },
                    ]}
                />
                <MetricBlock
                    title="Re-engagement"
                    subtitle="People coordinators can follow up with"
                    icon={RefreshCw}
                    tone="bg-teal-50 text-teal-600"
                    metrics={[
                        { label: 'Candidates', value: reengagement },
                        { label: 'Inactive donors', value: inactiveDonors },
                        { label: 'Active donors', value: activeDonors },
                        { label: 'Next step', value: 'Follow up' },
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk' }}>Blood Group Snapshot</h2>
                    <div className="space-y-2.5">
                        {bgDist.slice(0, 8).map(bg => {
                            const pct = Math.max(4, Math.round((bg.count / Math.max(donorLikeUsers, 1)) * 100));
                            return (
                                <div key={bg.group} className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <span className="text-xs text-gray-600 w-24 truncate">{bg.group}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--brand-primary)] rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 w-8 text-right">{bg.count}</span>
                                </div>
                            );
                        })}
                        {bgDist.length === 0 && <p className="text-sm text-gray-400">No blood group distribution available yet.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk' }}>Role Snapshot</h2>
                    <div className="space-y-2">
                        {roleDist.slice(0, 6).map(role => (
                            <div key={role.role} className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-3">
                                <span className="text-sm text-gray-700">{role.role}</span>
                                <span className="text-sm font-bold text-gray-900">{role.count}</span>
                            </div>
                        ))}
                        {roleDist.length === 0 && <p className="text-sm text-gray-400">No role distribution available yet.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk' }}>Recent System Activity</h2>
                    <div className="space-y-2">
                        {activity.slice(0, 5).map((item, i) => (
                            <div key={`${item.event}-${i}`} className="flex items-start sm:items-center gap-2 p-2.5 rounded-lg bg-gray-50">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activityTypeColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {item.type}
                                </span>
                                <span className="text-xs text-gray-600 flex-1 mobile-safe-text">{item.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk' }}>Top Eligible Donor Pool</h2>
                        <p className="text-xs text-gray-500 mt-0.5">A small preview for coordinator review. Open SmartMatch for ranking.</p>
                    </div>
                    <button onClick={() => navigate('/smartmatch')} className="w-full sm:w-auto text-left sm:text-right text-xs text-[var(--brand-primary)] hover:underline">Open SmartMatch</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {topPool.length > 0 ? topPool.map((donor, index) => (
                        <div key={String(donor.user_id || index)} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-red-50 text-[var(--brand-primary)] flex items-center justify-center text-xs font-bold">
                                    {String(donor.name || donor.user_id || 'D').charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-800 truncate">{String(donor.name || donor.user_id || 'Donor')}</div>
                                    <div className="text-[11px] text-gray-500 truncate">{String(donor.user_id || '')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Droplets size={12} />
                                {String(donor.blood_group || 'Unknown')}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <MapPin size={12} />
                                {String(donor.city || 'Location sampled')}
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-400">No eligible donor preview available yet.</p>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Hemolytics assists with donor prioritization. Final decisions remain with authorized human/medical staff.</span>
            </div>
        </div>
    );
}
