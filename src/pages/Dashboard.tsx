import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { donors, bloodRequests } from '../data/mockData';
import { getDashboard } from '../services/api';
import {
    Users, UserCheck, Droplets, MapPin, AlertTriangle, TrendingUp,
    ArrowRight, Clock, Activity, Database, RefreshCw, ChevronRight, Shield, Loader2
} from 'lucide-react';

const activityTypeColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    match: 'bg-blue-100 text-blue-700',
    outreach: 'bg-purple-100 text-purple-700',
    request: 'bg-red-100 text-red-700',
    system: 'bg-gray-100 text-gray-600',
};

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

    const m = metrics as Record<string, unknown>;
    const totalRecords = (m.totalRecords as number) || 0;
    const uniqueUsers = (m.uniqueUsers as number) || 0;
    const donorLikeUsers = (m.totalDonorLikeUsers as number) || 0;
    const activeDonors = (m.activeDonors as number) || 0;
    const inactiveDonors = (m.inactiveDonors as number) || 0;
    const eligibleDonors = (m.eligibleDonors as number) || 0;
    const notEligibleDonors = (m.notEligibleDonors as number) || 0;
    const missingBloodGroup = (m.missingBloodGroup as number) || 0;
    const missingLocation = (m.missingLocation as number) || 0;
    const locationCoverage = (m.locationCoveragePercent as number) || 0;
    const reengagement = (m.reengagementCandidates as number) || 0;
    const activeBridge = (m.activeBridgeCount as number) || 0;
    const bgDist = (m.bloodGroupDistribution as { group: string; count: number; color?: string }[]) || [];
    const topPool = (m.topEligibleDonorPool as typeof donors) || [];
    const activity = (m.recentActivity as { time: string; event: string; type: string }[]) || [];

    const statCards = [
        { label: 'Total Records Loaded', value: totalRecords, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Unique Users', value: uniqueUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Donor-like Users', value: donorLikeUsers, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Active Donors', value: activeDonors, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Inactive Donors', value: inactiveDonors, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Eligible Donors', value: eligibleDonors, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Not Eligible', value: notEligibleDonors, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Missing Blood Group', value: missingBloodGroup, icon: Droplets, color: 'text-gray-600', bg: 'bg-gray-50' },
        { label: 'Missing Location', value: missingLocation, icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Location Coverage', value: `${locationCoverage}%`, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Re-engagement Candidates', value: reengagement, icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Active Bridge/Requests', value: activeBridge, icon: Activity, color: 'text-[var(--brand-primary)]', bg: 'bg-red-50' },
    ];
    const activeRequests = bloodRequests.filter(r => r.status === 'open');

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    Donor Intelligence Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Blood Warriors dataset overview • AI-powered donor prioritization
                </p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon size={16} className={stat.color} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Blood Group Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Blood Group Distribution
                    </h2>
                    <div className="space-y-2.5">
                        {bgDist.map((bg) => {
                            const pct = Math.round((bg.count / (donorLikeUsers || 1)) * 100);
                            return (
                                <div key={bg.group} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{bg.group}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: bg.color }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 w-6 text-right">{bg.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Eligibility & Activity Summary */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Eligibility & Activity Summary
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                            <div className="flex items-center gap-2">
                                <UserCheck size={16} className="text-green-600" />
                                <span className="text-sm text-green-700">Eligible & Active</span>
                            </div>
                            <span className="text-lg font-bold text-green-700" style={{ fontFamily: 'Space Grotesk' }}>
                                {eligibleDonors}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-600" />
                                <span className="text-sm text-red-700">Not Eligible</span>
                            </div>
                            <span className="text-lg font-bold text-red-700" style={{ fontFamily: 'Space Grotesk' }}>
                                {notEligibleDonors}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-orange-600" />
                                <span className="text-sm text-orange-700">Inactive Donors</span>
                            </div>
                            <span className="text-lg font-bold text-orange-700" style={{ fontFamily: 'Space Grotesk' }}>
                                {inactiveDonors}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-100">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={16} className="text-teal-600" />
                                <span className="text-sm text-teal-700">Re-engagement Candidates</span>
                            </div>
                            <span className="text-lg font-bold text-teal-700" style={{ fontFamily: 'Space Grotesk' }}>
                                {reengagement}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bridge/Request Summary */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Bridge/Request Summary
                    </h2>
                    <div className="space-y-3">
                        {bloodRequests.map(req => (
                            <div key={req.request_id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                                <div>
                                    <div className="text-xs font-medium text-gray-700">{req.request_id}</div>
                                    <div className="text-[11px] text-gray-500">{req.required_blood_group} • {req.city}</div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${req.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                                        req.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {req.urgency}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/smartmatch')}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-medium hover:bg-[var(--brand-dark)] transition"
                    >
                        Run SmartMatch <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Re-engagement Candidates */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Re-engagement Candidates
                    </h2>
                    <div className="space-y-2">
                        {donors.filter(d => d.user_donation_active_status === 'Inactive').map(donor => (
                            <div key={donor.user_id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                                        {donor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700">{donor.name}</div>
                                        <div className="text-[11px] text-gray-500">{donor.blood_group} • {donor.city}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">Last donation</div>
                                    <div className="text-xs font-medium text-amber-700">{donor.last_donation_date || 'Unknown'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Recent Activity
                    </h2>
                    <div className="space-y-2">
                        {activity.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
                                <span className="text-[11px] text-gray-400 w-12 flex-shrink-0 font-mono">{item.time}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activityTypeColors[item.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {item.type}
                                </span>
                                <span className="text-sm text-gray-600 flex-1">{item.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Eligible Donor Pool Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                        Top Eligible Donor Pool Preview
                    </h2>
                    <button
                        onClick={() => navigate('/smartmatch')}
                        className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                    >
                        Open SmartMatch <ChevronRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                                <th className="pb-2 font-medium">Donor</th>
                                <th className="pb-2 font-medium">Blood Group</th>
                                <th className="pb-2 font-medium">City</th>
                                <th className="pb-2 font-medium">Donations</th>
                                <th className="pb-2 font-medium">Engagement</th>
                                <th className="pb-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donors.filter(d => d.eligibility_status === 'eligible' && d.user_donation_active_status === 'Active').slice(0, 5).map(donor => (
                                <tr key={donor.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] bg-opacity-10 flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">
                                                {donor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">{donor.name}</div>
                                                <div className="text-[11px] text-gray-400">{donor.user_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2.5 text-gray-600">{donor.blood_group}</td>
                                    <td className="py-2.5 text-gray-600">{donor.city}</td>
                                    <td className="py-2.5 text-gray-600">{donor.donations_till_date}</td>
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(1.0, donor.donations_till_date / 10) * 100}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500">{Math.round(Math.min(1.0, donor.donations_till_date / 10) * 100)}%</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Safety footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Hemolytics assists with donor prioritization. Final decisions remain with authorized human/medical staff.</span>
            </div>
        </div>
    );
}
