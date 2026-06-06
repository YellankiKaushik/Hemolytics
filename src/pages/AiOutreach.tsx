import React, { useState } from 'react';
import { bloodRequests, donors } from '../data/mockData';
import { generateOutreachMessage } from '../services/api';
import type { OutreachTone, OutreachLanguage } from '../types';
import {
    MessageSquare, Send, Copy, CheckCircle, AlertTriangle, Shield,
    Bot, User, Globe, ChevronDown, Loader2
} from 'lucide-react';

const tones: OutreachTone[] = ['urgent', 'empathetic', 'short SMS', 'WhatsApp-style', 'formal coordinator message'];
const languages: OutreachLanguage[] = ['English', 'Hindi'];

const persona = {
    name: 'Priya',
    role: 'Blood Warriors AI Coordinator',
    style: 'Warm, human, WhatsApp-style. Short messages. Never make medical claims.',
};


export default function AiOutreach() {
    const [selectedRequest, setSelectedRequest] = useState(bloodRequests[0]);
    const [selectedDonor, setSelectedDonor] = useState(donors[0]);
    const [tone, setTone] = useState<OutreachTone>('WhatsApp-style');
    const [language, setLanguage] = useState<OutreachLanguage>('English');
    const [generated, setGenerated] = useState<{ message: string; model: string; provider: string; safetyNotice: string; conversationId: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateOutreachMessage({
                donor: selectedDonor,
                request: {
                    request_id: selectedRequest.request_id,
                    required_blood_group: selectedRequest.required_blood_group,
                    city: selectedRequest.city,
                    urgency: selectedRequest.urgency,
                    quantity_required: selectedRequest.quantity_required,
                },
                tone,
                language,
                coordinatorPersona: 'Priya',
            });
            setGenerated(result);
            setCopied(false);
            setSent(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate message');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (generated) {
            navigator.clipboard.writeText(generated.message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSend = () => {
        setSent(true);
    };

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    AI Outreach Message
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Generate coordinator-style outreach with Priya AI persona
                </p>
            </div>

            {/* Safety note */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle size={14} />
                <span>Messages must be short, human, and WhatsApp-style. Never make medical claims. Never certify donor health.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Config */}
                <div className="space-y-4">
                    {/* Request Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            Request Summary
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-medium">Request</label>
                                <select
                                    value={selectedRequest.request_id}
                                    onChange={e => setSelectedRequest(bloodRequests.find(r => r.request_id === e.target.value) || bloodRequests[0])}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                                >
                                    {bloodRequests.map(r => (
                                        <option key={r.request_id} value={r.request_id}>
                                            {r.request_id} — {r.required_blood_group} ({r.city})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-50 text-xs text-gray-600 space-y-1">
                                <div><strong>Blood Group:</strong> {selectedRequest.required_blood_group}</div>
                                <div><strong>City:</strong> {selectedRequest.city}</div>
                                <div><strong>Urgency:</strong> {selectedRequest.urgency}</div>
                                <div><strong>Quantity:</strong> {selectedRequest.quantity_required}</div>
                            </div>
                        </div>
                    </div>

                    {/* Donor Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            Selected Donor
                        </h2>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 font-medium">Donor</label>
                            <select
                                value={selectedDonor.user_id}
                                onChange={e => setSelectedDonor(donors.find(d => d.user_id === e.target.value) || donors[0])}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                            >
                                {donors.filter(d => d.eligibility_status === 'eligible').map(d => (
                                    <option key={d.user_id} value={d.user_id}>
                                        {d.name} — {d.blood_group} ({d.city})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-2 p-2.5 rounded-lg bg-gray-50 text-xs text-gray-600 space-y-1">
                            <div><strong>Name:</strong> {selectedDonor.name}</div>
                            <div><strong>Blood Group:</strong> {selectedDonor.blood_group}</div>
                            <div><strong>City:</strong> {selectedDonor.city}</div>
                            <div><strong>Donations:</strong> {selectedDonor.donations_till_date}</div>
                            <div><strong>Calls:</strong> {selectedDonor.total_calls}</div>
                        </div>
                    </div>

                    {/* Tone & Language */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            Tone & Language
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tone</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {tones.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${tone === t
                                                    ? 'bg-[var(--brand-primary)] text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Language</label>
                                <div className="flex gap-1.5">
                                    {languages.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setLanguage(l)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${language === l
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <Globe size={12} /> {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Bot size={16} />
                                Generate Message
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                            <AlertTriangle size={14} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Persona badge */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 border border-purple-200">
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-sm font-bold text-purple-700">P</div>
                        <div>
                            <div className="text-sm font-semibold text-purple-800">Priya AI Coordinator</div>
                            <div className="text-xs text-purple-600">{persona.role} • {persona.style}</div>
                        </div>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                            AI-Generated Message Preview
                        </h2>
                        {generated ? (
                            <div className="p-4 rounded-xl bg-green-50 border border-green-200 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                {generated.message}
                            </div>
                        ) : (
                            <div className="p-8 rounded-xl bg-gray-50 border border-gray-100 text-center text-sm text-gray-400">
                                Click <strong>Generate Message</strong> to preview the AI-generated outreach
                            </div>
                        )}

                        {/* Action buttons */}
                        {generated && (
                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={handleGenerate}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
                                >
                                    <Bot size={14} /> Regenerate
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                >
                                    {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy Message</>}
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={sent}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${sent ? 'bg-green-600 text-white' : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]'
                                        }`}
                                >
                                    {sent ? <><CheckCircle size={14} /> Marked as Sent</> : <><Send size={14} /> Mark as Sent</>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Model Details */}
                    {generated && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                                AI Model Details
                            </h2>
                            <div className="space-y-1.5">
                                {[
                                    `Model: ${generated.model}`,
                                    `Provider: ${generated.provider}`,
                                    `Conversation ID: ${generated.conversationId}`,
                                    `Safety: ${generated.safetyNotice}`,
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 p-2 rounded-lg bg-gray-50">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-600">{i + 1}</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Safety footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Hemolytics does not certify donor health or blood safety. Outreach messages are AI-assisted suggestions only.</span>
            </div>
        </div>
    );
}
