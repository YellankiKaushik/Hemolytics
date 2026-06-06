import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loadDataset } from '../services/api';
import { IS_AWS_CONNECTED } from '../config/apiConfig';
import {
    AlertTriangle, ArrowRight, CheckCircle, Cloud, Database,
    FileText, Loader2, RefreshCw, Server, Shield, Table
} from 'lucide-react';

type DatasetLoadResult = {
    rowsLoaded?: number;
    cleanedRows?: number;
    uniqueUsersCreated?: number;
    duplicateGroupsHandled?: number;
    duplicate_user_ids_detected?: number;
    donor_deduplication_applied?: boolean;
    invalidBloodGroupsFlagged?: number;
    missingLocationFlagged?: number;
    donorsWrittenToHemolyticsDonors?: number;
    requestsWrittenToHemolyticsRequests?: number;
    loadStatus?: string;
    timestamp?: string;
    [key: string]: unknown;
};

const responseFields: Array<{ key: keyof DatasetLoadResult; label: string; tone?: string }> = [
    { key: 'rowsLoaded', label: 'rowsLoaded' },
    { key: 'cleanedRows', label: 'cleanedRows' },
    { key: 'uniqueUsersCreated', label: 'uniqueUsersCreated' },
    { key: 'duplicateGroupsHandled', label: 'duplicateGroupsHandled', tone: 'amber' },
    { key: 'duplicate_user_ids_detected', label: 'duplicate_user_ids_detected', tone: 'amber' },
    { key: 'donor_deduplication_applied', label: 'donor_deduplication_applied', tone: 'green' },
    { key: 'invalidBloodGroupsFlagged', label: 'invalidBloodGroupsFlagged', tone: 'red' },
    { key: 'missingLocationFlagged', label: 'missingLocationFlagged', tone: 'red' },
    { key: 'donorsWrittenToHemolyticsDonors', label: 'donorsWrittenToHemolyticsDonors', tone: 'green' },
    { key: 'requestsWrittenToHemolyticsRequests', label: 'requestsWrittenToHemolyticsRequests', tone: 'green' },
    { key: 'loadStatus', label: 'loadStatus', tone: 'green' },
    { key: 'timestamp', label: 'timestamp' },
];

function formatValue(value: unknown) {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null || value === undefined || value === '') return 'Not returned';
    return String(value);
}

function toneClass(tone?: string) {
    if (tone === 'green') return 'bg-green-50 border-green-100 text-green-800';
    if (tone === 'amber') return 'bg-amber-50 border-amber-100 text-amber-800';
    if (tone === 'red') return 'bg-red-50 border-red-100 text-red-800';
    return 'bg-gray-50 border-gray-100 text-gray-800';
}

export default function DatasetIngestion() {
    const navigate = useNavigate();
    const { setDatasetLoaded } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DatasetLoadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLoadDataset = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await loadDataset();
            setResult(response as DatasetLoadResult);
            setDatasetLoaded(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load dataset from S3');
        } finally {
            setLoading(false);
        }
    };

    const hasResult = result !== null;
    const completed = result?.loadStatus === 'completed';

    return (
        <div className="p-4 lg:p-6 space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    Dataset Ingestion
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Refresh the Blood Warriors dataset from S3 through Lambda into DynamoDB for coordinator decision support.
                </p>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                For this hackathon deployment, upload to S3 is handled outside the browser. This button reloads the S3 Dataset.csv into DynamoDB.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        S3 Dataset Reload
                    </h2>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                        <Cloud size={34} className="mx-auto text-[var(--brand-primary)] mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Dataset.csv is stored in S3</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Browser CSV upload is not part of this MVP. Reload uses the deployed Lambda endpoint.
                        </p>
                    </div>

                    <button
                        onClick={handleLoadDataset}
                        disabled={loading}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Loading from S3...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                Load / Reload Dataset from S3
                            </>
                        )}
                    </button>

                    {!hasResult && !error && (
                        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600">
                            Dataset is available in S3. Click Load / Reload Dataset from S3 to refresh DynamoDB.
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="font-semibold">Dataset load failed</div>
                                    <div className="mt-1 break-words">{error}</div>
                                    <button
                                        onClick={handleLoadDataset}
                                        disabled={loading}
                                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
                                    >
                                        {loading && <Loader2 size={13} className="animate-spin" />}
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                                Live AWS Load Result
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                {IS_AWS_CONNECTED
                                    ? 'Showing fields returned by POST /load-dataset.'
                                    : 'Mock Mode is active because VITE_API_BASE_URL is not set.'}
                            </p>
                        </div>
                        {hasResult && (
                            <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${completed ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {formatValue(result?.loadStatus)}
                            </span>
                        )}
                    </div>

                    {!hasResult ? (
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
                            <Database size={28} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-700">
                                No reload has run in this browser session yet.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Use the primary button to call the live backend and display the DynamoDB write summary here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-green-800 text-sm">
                                <CheckCircle size={17} />
                                <span>
                                    Dataset reload completed - {formatValue(result.rowsLoaded)} rows loaded, {formatValue(result.donorsWrittenToHemolyticsDonors)} donors written, {formatValue(result.requestsWrittenToHemolyticsRequests)} requests written.
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {responseFields.map(field => (
                                    <div key={field.key as string} className={`rounded-lg border p-3 ${toneClass(field.tone)}`}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Table size={12} className="opacity-70" />
                                            <span className="text-[11px] font-medium">{field.label}</span>
                                        </div>
                                        <div className="text-lg font-bold break-words" style={{ fontFamily: 'Space Grotesk' }}>
                                            {formatValue(result[field.key])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    AWS Data Flow
                </h2>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {[
                        { icon: FileText, label: 'Dataset.csv', color: 'text-orange-600 bg-orange-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Cloud, label: 'S3 bucket', color: 'text-green-600 bg-green-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Server, label: 'Lambda\nload_dataset', color: 'text-blue-600 bg-blue-50' },
                        { icon: ArrowRight, label: '', color: '' },
                        { icon: Database, label: 'DynamoDB\nDonors + Requests', color: 'text-purple-600 bg-purple-50' },
                    ].map((step, i) => (
                        step.label === '' ? (
                            <ArrowRight key={i} size={20} className="text-gray-300 flex-shrink-0" />
                        ) : (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100" style={{ minWidth: '112px' }}>
                                <div className={`w-10 h-10 rounded-lg ${step.color} flex items-center justify-center`}>
                                    <step.icon size={20} />
                                </div>
                                <span className="text-xs text-gray-600 text-center whitespace-pre-line">{step.label}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    Target DynamoDB Tables
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        {
                            name: 'HemolyticsDonors',
                            desc: 'Deduplicated donor profiles keyed by user_id',
                            value: hasResult ? formatValue(result.donorsWrittenToHemolyticsDonors) : 'Pending reload',
                        },
                        {
                            name: 'HemolyticsRequests',
                            desc: 'Bridge/request candidates keyed by request_id',
                            value: hasResult ? formatValue(result.requestsWrittenToHemolyticsRequests) : 'Pending reload',
                        },
                    ].map(table => (
                        <div key={table.name} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <Database size={18} className="text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-mono font-medium text-gray-800">{table.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{table.desc}</div>
                            </div>
                            <div className="text-sm font-bold text-purple-600 text-right" style={{ fontFamily: 'Space Grotesk' }}>
                                {table.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} />
                <span>Dataset ingestion supports coordinator analytics only. It does not certify donor health, donor eligibility, or blood safety.</span>
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
