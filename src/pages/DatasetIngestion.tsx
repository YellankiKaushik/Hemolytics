import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donors, bloodRequests, cleaningSummary } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';
import { loadDataset } from '../services/api';
import {
    Upload, Database, CheckCircle, ArrowRight, Table, AlertTriangle,
    Loader2, FileText, Cloud, Server, Shield
} from 'lucide-react';

export default function DatasetIngestion() {
    const navigate = useNavigate();
    const { datasetLoaded, setDatasetLoaded } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(datasetLoaded);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLoadDataset = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await loadDataset();
            setResult(res);
            setLoaded(true);
            setDatasetLoaded(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load dataset');
        } finally {
            setLoading(false);
        }
    };

    const r = result as Record<string, unknown> | null;

    const summaryItems = [
        { label: 'Total Rows', value: (r?.rowsLoaded as number) ?? cleaningSummary.total_rows, icon: Table },
        { label: 'Unique Users', value: (r?.uniqueUsersCreated as number) ?? cleaningSummary.unique_users, icon: Database },
        { label: 'Duplicate Groups Handled', value: (r?.duplicateGroupsHandled as number) ?? cleaningSummary.duplicate_user_ids, icon: AlertTriangle, warn: ((r?.duplicateGroupsHandled as number) ?? 0) > 0 },
        { label: 'Invalid Blood Groups Flagged', value: (r?.invalidBloodGroupsFlagged as number) ?? cleaningSummary.missing_blood_groups, icon: AlertTriangle, warn: ((r?.invalidBloodGroupsFlagged as number) ?? 0) > 0 },
        { label: 'Missing Locations Flagged', value: (r?.missingLocationFlagged as number) ?? cleaningSummary.missing_locations, icon: AlertTriangle, warn: true },
        { label: 'Donors Written to DynamoDB', value: (r?.donorsWrittenToHemolyticsDonors as number) ?? cleaningSummary.donor_profiles_created, icon: CheckCircle, ok: true },
        { label: 'Requests Written to DynamoDB', value: (r?.requestsWrittenToHemolyticsRequests as number) ?? cleaningSummary.bridge_request_candidates, icon: CheckCircle, ok: true },
        { label: 'Load Status', value: (r?.loadStatus as string) ?? 'pending', icon: Loader2, ok: (r?.loadStatus as string) === 'completed' },
    ];

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    Dataset Ingestion
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Reload the Blood Warriors dataset from S3 through Lambda into DynamoDB for coordinator decision support.
                </p>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                For this hackathon deployment, dataset upload is handled through S3. The UI demonstrates ingestion and reload from the deployed backend, then shows cleaning and write summaries returned by Lambda.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Upload Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        CSV Upload
                    </h2>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[var(--brand-primary)] transition-colors">
                        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Dataset.csv lives in S3</p>
                        <p className="text-xs text-gray-400">Upload through AWS S3, then reload here</p>
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            style={{ position: 'relative' }}
                        />
                    </div>

                    <button
                        onClick={handleLoadDataset}
                        disabled={loading}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Loading Dataset...
                            </>
                        ) : (
                            <>
                                <Database size={16} />
                                Load Blood Warriors Dataset
                            </>
                        )}
                    </button>

                    {loaded && !error && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                            <CheckCircle size={14} />
                            Dataset reload completed - {results?.rowsLoaded ?? cleaningSummary.total_rows} records processed
                        </div>
                    )}
                </div>

                {/* Cleaning Summary */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Cleaning Summary
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {summaryItems.map(item => (
                            <div
                                key={item.label}
                                className={`p-3 rounded-lg border ${item.warn ? 'bg-red-50 border-red-100' : item.ok ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <item.icon size={12} className={item.warn ? 'text-red-500' : item.ok ? 'text-green-500' : 'text-gray-400'} />
                                    <span className="text-[11px] text-gray-500">{item.label}</span>
                                </div>
                                <div className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk' }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                    {r && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-blue-800">
                                <div className="font-semibold">Cleaned rows</div>
                                <div className="text-lg font-bold mt-1">{String(r.cleanedRows ?? r.rowsLoaded ?? 0)}</div>
                            </div>
                            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-amber-800">
                                <div className="font-semibold">Duplicate user IDs</div>
                                <div className="text-lg font-bold mt-1">{String(r.duplicate_user_ids_detected ?? r.duplicateGroupsHandled ?? 0)}</div>
                            </div>
                            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-green-800">
                                <div className="font-semibold">Donor dedupe</div>
                                <div className="text-lg font-bold mt-1">{r.donor_deduplication_applied ? 'Applied' : 'Ready'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AWS Data Flow */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    AWS Data Flow
                </h2>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {[
                        { icon: FileText, label: 'CSV', color: 'text-orange-600 bg-orange-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Cloud, label: 'S3', color: 'text-green-600 bg-green-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Server, label: 'Lambda\ndatasetLoader', color: 'text-blue-600 bg-blue-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Database, label: 'DynamoDB', color: 'text-purple-600 bg-purple-50' },
                    ].map((step, i) => (
                        step.label === '' ? (
                            <ArrowRight key={i} size={20} className="text-gray-300 flex-shrink-0" />
                        ) : (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100" style={{ minWidth: '100px' }}>
                                <div className={`w-10 h-10 rounded-lg ${step.color} flex items-center justify-center`}>
                                    <step.icon size={20} />
                                </div>
                                <span className="text-xs text-gray-600 text-center whitespace-pre-line">{step.label}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Target DynamoDB Tables */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    Target DynamoDB Tables
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { name: 'HemolyticsDonors', desc: 'Donor profiles from Blood Warriors dataset', count: donors.length },
                        { name: 'HemolyticsRequests', desc: 'Bridge/request candidates extracted from dataset', count: bloodRequests.length },
                    ].map(table => (
                        <div key={table.name} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Database size={18} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-mono font-medium text-gray-800">{table.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{table.desc}</div>
                            </div>
                            <div className="text-lg font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk' }}>
                                {table.count}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dataset Preview */}
            {loaded && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        Dataset Preview
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                                    <th className="pb-2 font-medium">User ID</th>
                                    <th className="pb-2 font-medium">Name</th>
                                    <th className="pb-2 font-medium">Blood Group</th>
                                    <th className="pb-2 font-medium">City</th>
                                    <th className="pb-2 font-medium">Role</th>
                                    <th className="pb-2 font-medium">Eligibility</th>
                                    <th className="pb-2 font-medium">Active Status</th>
                                    <th className="pb-2 font-medium">Donations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donors.map(donor => (
                                    <tr key={donor.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2 font-mono text-xs text-gray-500">{donor.user_id}</td>
                                        <td className="py-2 font-medium text-gray-700">{donor.name}</td>
                                        <td className="py-2 text-gray-600">{donor.blood_group}</td>
                                        <td className="py-2 text-gray-600">{donor.city || '—'}</td>
                                        <td className="py-2 text-gray-600">{donor.role}</td>
                                        <td className="py-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${donor.eligibility_status === 'eligible' ? 'bg-green-100 text-green-700' :
                                                    donor.eligibility_status === 'not_eligible' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {donor.eligibility_status}
                                            </span>
                                        </td>
                                        <td className="py-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${donor.user_donation_active_status === 'Active' ? 'bg-blue-100 text-blue-700' :
                                                    donor.user_donation_active_status === 'Inactive' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {donor.user_donation_active_status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-gray-600">{donor.donations_till_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Safety footer */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Dataset ingestion supports coordinator analytics only. Do not upload public files containing unapproved sensitive data.</span>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition"
                >
                    View Dashboard <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
