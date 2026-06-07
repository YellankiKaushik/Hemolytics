import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runSmartMatch } from '../services/api';
import type { MatchResult, BloodGroup } from '../types';
import {
    Search, Zap, MapPin, Clock, Shield, AlertTriangle, CheckCircle,
    ChevronDown, Loader2, ArrowRight, Target
} from 'lucide-react';

const bloodGroups: BloodGroup[] = [
    'A Positive', 'B Positive', 'O Positive', 'AB Positive',
    'O Negative', 'B Negative', 'A Negative', 'AB Negative', 'Bombay Blood Group'
];

const cities = [
    { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
];

const urgencyOptions = ['Low', 'Medium', 'High', 'Critical'];

export default function SmartMatch() {
    const navigate = useNavigate();
    const [requestId, setRequestId] = useState('REQ-001');
    const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O Positive');
    const [city, setCity] = useState('Hyderabad');
    const [urgency, setUrgency] = useState('Critical');
    const [quantity, setQuantity] = useState(1);
    const [neededBy, setNeededBy] = useState('2026-06-07T10:00');
    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [matchTime, setMatchTime] = useState(0);
    const [selectedDonor, setSelectedDonor] = useState<string | null>(null);

    const [matchMeta, setMatchMeta] = useState<{ total: number; eligible: number }>({ total: 0, eligible: 0 });
    const [error, setError] = useState<string | null>(null);

    const selectedCity = cities.find(c => c.name === city) || cities[0];

    const handleRunMatch = async () => {
        setLoading(true);
        setShowResults(false);
        setSelectedDonor(null);
        setError(null);
        try {
            const res = await runSmartMatch({
                requestId,
                requiredBloodGroup: bloodGroup,
                latitude: selectedCity.lat,
                longitude: selectedCity.lng,
                city: selectedCity.name,
                urgency,
                quantityRequired: quantity,
                neededBy,
            });
            setMatchTime(res.matchTimeMs);
            setResults(res.results);
            setMatchMeta({ total: res.totalCandidates, eligible: res.eligibleCandidates });
            setShowResults(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'SmartMatch failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDonor = (donorId: string) => {
        setSelectedDonor(donorId);
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    SmartMatch Donor Ranking
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    SmartMatch ranks donors to contact first. It does not guarantee real-time availability.
                </p>
            </div>

            {/* Safety note */}
            <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>Prioritized for coordinator review, not medical approval. Hard filters include blood group match, eligible status, active status, and valid location.</span>
            </div>

            {/* Request Form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Search size={16} className="text-[var(--brand-primary)]" />
                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>Match Request</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Request ID</label>
                        <input
                            value={requestId}
                            onChange={e => setRequestId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Required Blood Group</label>
                        <select
                            value={bloodGroup}
                            onChange={e => setBloodGroup(e.target.value as BloodGroup)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        >
                            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">City / Location</label>
                        <select
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        >
                            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Urgency</label>
                        <select
                            value={urgency}
                            onChange={e => setUrgency(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        >
                            {urgencyOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Quantity Required</label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Needed By</label>
                        <input
                            type="datetime-local"
                            value={neededBy}
                            onChange={e => setNeededBy(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleRunMatch}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Matching...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} />
                                    Run SmartMatch
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hard Filters Applied */}
            {showResults && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                        Hard Filters Applied
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            `Blood group = ${bloodGroup}`,
                            'eligibility_status = eligible',
                            'user_donation_active_status = Active',
                            'latitude/longitude valid',
                            'role usable as donor type',
                        ].map((filter, i) => (
                            <span key={i} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 mobile-safe-text">
                                <CheckCircle size={12} className="flex-shrink-0" />
                                {filter}
                            </span>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        Match completed in {matchTime}ms • Showing top {results.length} ranked donors
                    </div>
                </div>
            )}

            {/* Results */}
            {showResults && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                        Top 5 Ranked Donors
                    </h2>
                    {results.map((r) => (
                        <div
                            key={r.donor_id}
                            className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 transition-all ${r.match_score === 0
                                    ? 'border-gray-100 opacity-60'
                                    : selectedDonor === r.donor_id
                                        ? 'border-green-300 ring-2 ring-green-100'
                                        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    {/* Rank badge */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${r.rank === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                            r.rank === 2 ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                                                r.rank === 3 ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                                    'bg-gray-50 text-gray-400 border border-gray-100'
                                        }`} style={{ fontFamily: 'Space Grotesk' }}>
                                        #{r.rank}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800 truncate max-w-full">{r.donor_name}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono max-w-full truncate">{r.donor_id}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.confidence_label === 'High' ? 'bg-green-100 text-green-700' :
                                                    r.confidence_label === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-600'
                                                }`}>
                                                {r.confidence_label} Confidence
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                                            <span>{r.blood_group}</span>
                                            <span>•</span>
                                            <span>{r.role}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><MapPin size={12} />{r.distance_km}km</span>
                                            <span>•</span>
                                            <span>{r.donations_till_date} donations</span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-gray-400 mobile-safe-text">{r.reason}</div>
                                    </div>
                                </div>
                                <div className="sm:text-right flex sm:block items-end justify-between gap-3">
                                    <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk' }}>
                                        {r.match_score > 0 ? r.match_score : '—'}
                                    </div>
                                    <div className="text-[10px] text-gray-400">match score</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        Engagement: {Math.round(r.engagement_score * 100)}%
                                    </div>
                                </div>
                            </div>

                            {/* Match bar */}
                            {r.match_score > 0 && (
                                <div className="mt-3">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${r.match_score}%`,
                                                backgroundColor: r.confidence_label === 'High' ? '#388E3C' : r.confidence_label === 'Medium' ? '#F57C00' : '#D32F2F'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Recommended Action */}
                            {r.match_score > 0 && r.recommended_action && (
                                <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                                    <Target size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-[11px] text-blue-700 mobile-safe-text">{r.recommended_action}</span>
                                </div>
                            )}

                            {/* Select button */}
                            {r.match_score > 0 && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={() => handleSelectDonor(r.donor_id)}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition ${selectedDonor === r.donor_id
                                                ? 'bg-green-600 text-white'
                                                : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]'
                                            }`}
                                    >
                                        {selectedDonor === r.donor_id ? (
                                            <>
                                                <CheckCircle size={14} />
                                                Selected
                                            </>
                                        ) : (
                                            <>
                                                Select Donor <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedDonor && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-green-800">Donor selected for coordinator outreach</div>
                        <div className="text-xs text-green-700 mt-0.5">Next step: draft a safe message. Availability and eligibility still require human follow-up.</div>
                    </div>
                    <button
                        onClick={() => navigate('/ai-outreach')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                    >
                        Generate Outreach <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-400 mb-3" />
                    <p className="text-sm text-red-700 font-medium">SmartMatch Unavailable</p>
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                </div>
            )}

            {/* Empty state */}
            {!showResults && !loading && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
                    <Search size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Configure the match request and click <strong>Run SmartMatch</strong> to rank donors</p>
                </div>
            )}

            {/* Safety footer */}
            <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                <span>Hemolytics does not certify donor health or blood safety. Final decisions remain with authorized human/medical staff.</span>
            </div>
        </div>
    );
}
