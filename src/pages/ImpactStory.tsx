import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ImpactTone } from '../types';
import { generateImpactStory } from '../services/api';
import {
    Heart, AlertTriangle, Shield, Copy, CheckCircle, Loader2
} from 'lucide-react';

const tones: { value: ImpactTone; label: string; desc: string }[] = [
    { value: 'awareness', label: 'Awareness', desc: 'Public awareness about blood donation need' },
    { value: 'donor motivation', label: 'Donor Motivation', desc: 'Encourage donors to stay active' },
    { value: 'coordinator summary', label: 'Coordinator Summary', desc: 'Internal summary for coordinators' },
    { value: 'social post', label: 'Social Post', desc: 'Social media style post' },
];

export default function ImpactStory() {
    const navigate = useNavigate();
    const [donorsContacted, setDonorsContacted] = useState(12);
    const [responsesReceived, setResponsesReceived] = useState(7);
    const [potentialMatches, setPotentialMatches] = useState(4);
    const [campaignCity, setCampaignCity] = useState('Hyderabad');
    const [bloodGroup, setBloodGroup] = useState('O Positive');
    const [patientContext, setPatientContext] = useState('Anonymized thalassemia patient requiring regular O Positive transfusions');
    const [tone, setTone] = useState<ImpactTone>('awareness');
    const [generated, setGenerated] = useState<{
        awarenessMessage: string;
        socialPost: string;
        coordinatorSummary: string;
        safetyNotice: string;
        bedrock_available?: boolean;
        fallback_used?: boolean;
    } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cities = ['Hyderabad', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Pune'];
    const bloodGroups = ['A Positive', 'B Positive', 'O Positive', 'AB Positive', 'O Negative', 'B Negative', 'Bombay Blood Group'];

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setGenerated(null);
        try {
            const result = await generateImpactStory({
                donorsContacted,
                responsesReceived,
                potentialMatches,
                campaignCity,
                bloodGroup,
                patientSafeContext: patientContext,
                tone,
            });
            setGenerated(result);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate impact story');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    Impact & Awareness Story
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Create anonymized awareness and coordinator summaries from outreach activity.
                </p>
            </div>

            {/* Safety rules */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <div><strong>Content Rules:</strong></div>
                    <div>No patient PII • No fake medical claims • No guaranteed survival claims</div>
                    <div>No claim that donation happened unless clearly simulated/demo</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Input Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            Campaign Inputs
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1 font-medium">Donors Contacted</label>
                                    <input type="number" value={donorsContacted} onChange={e => setDonorsContacted(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1 font-medium">Responses Received</label>
                                    <input type="number" value={responsesReceived} onChange={e => setResponsesReceived(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-medium">Potential Matches Found</label>
                                <input type="number" value={potentialMatches} onChange={e => setPotentialMatches(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-medium">Campaign City</label>
                                <select value={campaignCity} onChange={e => setCampaignCity(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition">
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-medium">Blood Group</label>
                                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition">
                                    {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-medium">Patient-safe Anonymized Context</label>
                                <textarea value={patientContext} onChange={e => setPatientContext(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Tone selector */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            Content Tone
                        </h2>
                        <div className="space-y-2">
                            {tones.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setTone(t.value)}
                                    className={`w-full text-left p-3 rounded-lg border transition ${tone === t.value
                                            ? 'bg-[var(--brand-primary)] bg-opacity-5 border-[var(--brand-primary)] text-gray-800'
                                            : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <div className="text-sm font-medium">{t.label}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Heart size={16} />
                                Generate Impact Content
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold">Impact story generation failed</div>
                                <div className="text-xs mt-1">{error}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Output */}
                <div className="lg:col-span-2 space-y-4">
                    {generated ? (
                        <>
                            {/* Awareness Message */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                                        Awareness Message
                                    </h2>
                                    <button onClick={() => handleCopy(generated.awarenessMessage, 'awareness')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                        {copiedField === 'awareness' ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                    {generated.awarenessMessage}
                                </div>
                            </div>

                            {/* Social Post */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                                        Social Post Style
                                    </h2>
                                    <button onClick={() => handleCopy(generated.socialPost, 'social')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                        {copiedField === 'social' ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                    {generated.socialPost}
                                </div>
                            </div>

                            {/* Coordinator Summary */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                                        Coordinator Summary
                                    </h2>
                                    <button onClick={() => handleCopy(generated.coordinatorSummary, 'coordinator')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                        {copiedField === 'coordinator' ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                    {generated.coordinatorSummary}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                                    Safety Notice
                                </h2>
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800 leading-relaxed">
                                    {generated.safetyNotice}
                                </div>
                                {generated.fallback_used && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
                                        <Shield size={13} />
                                        Safe fallback message used.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : loading ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <Loader2 size={40} className="mx-auto text-[var(--brand-primary)] animate-spin mb-3" />
                            <p className="text-sm text-gray-500">Generating safe awareness content...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <Heart size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">Configure inputs and click <strong>Generate Impact Content</strong> to create safe awareness messages</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Safety footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>All generated content follows safe messaging rules. No patient PII. No medical claims. No guaranteed survival statements.</span>
            </div>

            {generated && (
                <div className="flex justify-end">
                    <button
                        onClick={() => navigate('/api-settings')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
                    >
                        View API Settings / Final Demo <CheckCircle size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
