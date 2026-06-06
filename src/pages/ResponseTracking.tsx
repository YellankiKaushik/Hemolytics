import React, { useState } from 'react';
import { donorResponses } from '../data/mockData';
import { submitDonorResponse } from '../services/api';
import type { ResponseStatus, DonorResponse, MatchResult } from '../types';
import {
    Activity, AlertTriangle, CheckCircle, Clock, ArrowRight,
    Shield, ChevronDown, MessageSquare, User, Loader2
} from 'lucide-react';

const statusColors: Record<ResponseStatus, string> = {
    'Not contacted': 'bg-gray-100 text-gray-600',
    'Message sent': 'bg-blue-100 text-blue-700',
    'Interested': 'bg-purple-100 text-purple-700',
    'Available': 'bg-green-100 text-green-700',
    'Unavailable': 'bg-red-100 text-red-600',
    'Needs follow-up': 'bg-orange-100 text-orange-700',
    'Escalated': 'bg-red-100 text-red-700',
    'Donor confirmed': 'bg-green-200 text-green-800',
    'Coordinator attention needed': 'bg-amber-100 text-amber-800',
};

const escalationRules = [
    { response: 'confirm', result: 'donor_confirmed', color: 'text-green-700', icon: CheckCircle },
    { response: 'decline', result: 'Move to next ranked donor', color: 'text-red-600', icon: ArrowRight },
    { response: 'no response', result: 'Escalate to next donor', color: 'text-orange-600', icon: AlertTriangle },
    { response: 'reschedule', result: 'needs_follow_up', color: 'text-blue-600', icon: Clock },
    { response: 'all failed', result: 'needs_coordinator_attention', color: 'text-amber-700', icon: AlertTriangle },
];

export default function ResponseTracking() {
    const [responses, setResponses] = useState<DonorResponse[]>(donorResponses);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [testResponseText, setTestResponseText] = useState('Yes, I am available');
    const [latestAnalysis, setLatestAnalysis] = useState<{
        detectedIntent: string;
        responseStatus: string;
        aiSummary: string;
        nextAction: string;
        escalationTriggered: boolean;
        nextDonorId: string | null;
        updatedRequestStatus: string;
    } | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const rankedDonors: MatchResult[] = [
        {
            rank: 1,
            donor_id: 'DONOR-001',
            donor_name: 'Asha Rao',
            blood_group: 'O Positive',
            role: 'Donor',
            distance_km: 4.2,
            eligibility_status: 'eligible',
            active_status: 'Active',
            donations_till_date: 4,
            engagement_score: 0.82,
            match_score: 91,
            confidence_label: 'High',
            reason: 'Demo ranked donor',
            recommended_action: 'Coordinator review',
            request_id: 'REQ-001',
        },
        {
            rank: 2,
            donor_id: 'DONOR-002',
            donor_name: 'Rohan Mehta',
            blood_group: 'O Positive',
            role: 'Donor',
            distance_km: 8.7,
            eligibility_status: 'eligible',
            active_status: 'Active',
            donations_till_date: 2,
            engagement_score: 0.68,
            match_score: 78,
            confidence_label: 'Medium',
            reason: 'Demo backup donor',
            recommended_action: 'Next donor for escalation',
            request_id: 'REQ-001',
        },
    ];

    const displayStatus = (status: string): ResponseStatus => {
        if (status === 'donor_confirmed' || status === 'confirmed') return 'Donor confirmed';
        if (status === 'escalated' || status === 'escalate_to_next_donor') return 'Escalated';
        if (status === 'needs_follow_up') return 'Needs follow-up';
        if (status === 'needs_coordinator_attention') return 'Coordinator attention needed';
        return 'Needs follow-up';
    };

    const handleAnalyzeResponse = async () => {
        setAnalysisLoading(true);
        setAnalysisError(null);
        try {
            const result = await submitDonorResponse({
                requestId: 'REQ-001',
                donorId: 'DONOR-001',
                responseText: testResponseText,
                currentRank: 1,
                rankedDonors,
            });
            const visibleResult = {
                ...result,
                responseStatus: result.detectedIntent === 'confirm'
                    ? 'donor_confirmed'
                    : result.detectedIntent === 'decline'
                        ? 'escalate_to_next_donor'
                        : result.responseStatus,
                updatedRequestStatus: result.detectedIntent === 'confirm'
                    ? 'donor_confirmed'
                    : result.updatedRequestStatus,
            };
            setLatestAnalysis(visibleResult);
            const nextStatus = displayStatus(visibleResult.updatedRequestStatus || visibleResult.responseStatus);
            setResponses(prev => prev.map((r, index) => index === 0 ? {
                ...r,
                donor_response_text: testResponseText,
                ai_detected_intent: visibleResult.detectedIntent as DonorResponse['ai_detected_intent'],
                outreach_status: nextStatus,
                escalation_flag: visibleResult.escalationTriggered,
                ai_summary: visibleResult.aiSummary,
                suggested_action: visibleResult.nextAction,
                timestamp: new Date().toLocaleString(),
            } : r));
            setExpandedRow(responses[0]?.id || null);
        } catch (err: unknown) {
            setAnalysisError(err instanceof Error ? err.message : 'Response analysis failed');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleAction = (id: string, action: string) => {
        setResponses(prev => prev.map(r => {
            if (r.id !== id) return r;
            switch (action) {
                case 'confirm':
                    return { ...r, outreach_status: 'Donor confirmed' as ResponseStatus, escalation_flag: false };
                case 'decline':
                    return { ...r, outreach_status: 'Escalated' as ResponseStatus, escalation_flag: true };
                case 'followup':
                    return { ...r, outreach_status: 'Needs follow-up' as ResponseStatus };
                default:
                    return r;
            }
        }));
    };

    const statusCounts = responses.reduce((acc, r) => {
        acc[r.outreach_status] = (acc[r.outreach_status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    Donor Response Tracking
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Classify donor replies, update visible status, and decide whether to escalate to the next ranked donor
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                        Test Donor Reply
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">Try "Yes, I am available" or "Sorry, I cannot donate today".</p>
                    <textarea
                        value={testResponseText}
                        onChange={e => setTestResponseText(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition resize-none"
                    />
                    <button
                        onClick={handleAnalyzeResponse}
                        disabled={analysisLoading}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition disabled:opacity-60"
                    >
                        {analysisLoading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><MessageSquare size={16} /> Analyze Response</>}
                    </button>
                    {analysisError && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                            {analysisError}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                        Latest AI Response Analysis
                    </h2>
                    {latestAnalysis ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                                    <div className="text-[11px] text-blue-600 font-medium">detectedIntent</div>
                                    <div className="text-sm font-bold text-blue-900 mt-1">{latestAnalysis.detectedIntent}</div>
                                </div>
                                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                                    <div className="text-[11px] text-green-600 font-medium">responseStatus</div>
                                    <div className="text-sm font-bold text-green-900 mt-1">{latestAnalysis.responseStatus}</div>
                                </div>
                                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                                    <div className="text-[11px] text-red-600 font-medium">escalationTriggered</div>
                                    <div className="text-sm font-bold text-red-900 mt-1">{latestAnalysis.escalationTriggered ? 'true' : 'false'}</div>
                                </div>
                                <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                                    <div className="text-[11px] text-purple-600 font-medium">nextDonorId</div>
                                    <div className="text-sm font-bold text-purple-900 mt-1">{latestAnalysis.nextDonorId || 'none'}</div>
                                </div>
                            </div>
                            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">AI summary</div>
                                <div className="text-sm text-gray-700">{latestAnalysis.aiSummary}</div>
                            </div>
                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                                <div className="text-[11px] text-blue-600 uppercase tracking-wider mb-1">Next action</div>
                                <div className="text-sm text-blue-800">{latestAnalysis.nextAction}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-6 text-center text-sm text-gray-500">
                            Run a sample donor reply to see the latest AI response analysis here.
                        </div>
                    )}
                </div>
            </div>

            {/* Status summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                        <div className="text-xs text-gray-500 mb-1">{status}</div>
                        <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk' }}>{count}</div>
                    </div>
                ))}
            </div>

            {/* Escalation Rules */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                    Escalation Rules
                </h2>
                <div className="flex flex-wrap gap-3">
                    {escalationRules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                            <span className="font-medium text-gray-600">IF</span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{rule.response}</span>
                            <span className="font-medium text-gray-600">→</span>
                            <span className={`px-2 py-0.5 rounded font-medium ${rule.color}`}>{rule.result}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Response Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                        Response Board
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 bg-gray-50">
                                <th className="px-5 py-3 font-medium">Request</th>
                                <th className="px-5 py-3 font-medium">Donor</th>
                                <th className="px-5 py-3 font-medium">Blood Group</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium">AI Intent</th>
                                <th className="px-5 py-3 font-medium">Escalation</th>
                                <th className="px-5 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map(r => (
                                <React.Fragment key={r.id}>
                                    <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>
                                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.request_id}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {r.donor_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-700">{r.donor_name}</div>
                                                    <div className="text-[11px] text-gray-400">{r.donor_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">{r.donor_blood_group}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusColors[r.outreach_status]}`}>
                                                {r.outreach_status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-medium ${r.ai_detected_intent === 'confirm' ? 'text-green-600' :
                                                    r.ai_detected_intent === 'decline' ? 'text-red-600' :
                                                        r.ai_detected_intent === 'no_response' ? 'text-orange-600' :
                                                            r.ai_detected_intent === 'reschedule' ? 'text-blue-600' :
                                                                'text-gray-500'
                                                }`}>
                                                {r.ai_detected_intent}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {r.escalation_flag && (
                                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                                    <AlertTriangle size={10} />
                                                    Escalated
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                            <div className="flex gap-1">
                                                {r.outreach_status !== 'Donor confirmed' && r.outreach_status !== 'Escalated' && (
                                                    <>
                                                        <button onClick={() => handleAction(r.id, 'confirm')} className="text-[10px] px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition">Confirm</button>
                                                        <button onClick={() => handleAction(r.id, 'decline')} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition">Decline</button>
                                                        <button onClick={() => handleAction(r.id, 'followup')} className="text-[10px] px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 transition">Follow-up</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRow === r.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={7} className="px-5 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Donor Response</div>
                                                        <div className="text-sm text-gray-700 p-2 rounded-lg bg-white border border-gray-100">
                                                            {r.donor_response_text || 'No response received'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">AI Summary</div>
                                                        <div className="text-sm text-gray-700 p-2 rounded-lg bg-white border border-gray-100">
                                                            {r.ai_summary}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Suggested Action</div>
                                                        <div className="text-sm text-gray-700 p-2 rounded-lg bg-blue-50 border border-blue-100">
                                                            {r.suggested_action}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                                                    <Clock size={12} />
                                                    {r.timestamp}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Safety footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Hemolytics assists with response understanding. Escalation decisions should be reviewed by authorized coordinators.</span>
            </div>
        </div>
    );
}
