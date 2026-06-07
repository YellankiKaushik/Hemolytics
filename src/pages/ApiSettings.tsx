import React from 'react';
import {
    Activity, CheckCircle, Cloud, Cpu, Database, FileText,
    Globe, Server, Shield, Wifi, WifiOff
} from 'lucide-react';
import { IS_AWS_CONNECTED, API_BASE_URL, BEDROCK_MODEL_ID } from '../config/apiConfig';

const endpoints = [
    { method: 'GET' as const, path: '/health', description: 'Health check endpoint' },
    { method: 'GET' as const, path: '/dashboard', description: 'Dashboard metrics and summary data' },
    { method: 'POST' as const, path: '/load-dataset', description: 'Ingest Blood Warriors CSV dataset' },
    { method: 'POST' as const, path: '/match', description: 'Run SmartMatch donor ranking' },
    { method: 'POST' as const, path: '/chat', description: 'AI outreach message generation via Bedrock' },
    { method: 'POST' as const, path: '/response', description: 'Record donor responses and escalation status' },
    { method: 'POST' as const, path: '/impact-story', description: 'Generate safe impact and awareness content' },
];

const dynamoTables = [
    { name: 'HemolyticsDonors', description: 'Donor profiles from Blood Warriors dataset', key: 'user_id' },
    { name: 'HemolyticsRequests', description: 'Bridge/request candidates extracted from dataset', key: 'request_id' },
    { name: 'HemolyticsConversations', description: 'Outreach conversation history and context', key: 'conversation_id' },
    { name: 'HemolyticsResponses', description: 'Donor response tracking and escalation log', key: 'response_id' },
];

const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
};

const liveChecks = [
    { label: 'Health endpoint', path: '/health', status: 'Confirms API Gateway and Lambda are reachable', tone: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle },
    { label: 'Dashboard endpoint', path: '/dashboard', status: 'Returns sampled analytics for demo-speed loading', tone: 'bg-blue-50 text-blue-700 border-blue-100', icon: Activity },
    { label: 'SmartMatch endpoint', path: '/match', status: 'Ranks donors for coordinator review', tone: 'bg-purple-50 text-purple-700 border-purple-100', icon: Shield },
];

export default function ApiSettings() {
    const modeLabel = IS_AWS_CONNECTED ? 'AWS Connected Mode' : 'Mock Mode';
    const modeColor = IS_AWS_CONNECTED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
    const ModeIcon = IS_AWS_CONNECTED ? Wifi : WifiOff;

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                    AWS Connection & Backend Contract
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Live AWS connection, API endpoints, DynamoDB tables, Bedrock model, and production readiness notes for the demo.
                </p>
            </div>

            <div className={`flex items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border ${modeColor}`}>
                <ModeIcon size={20} className="mt-0.5 sm:mt-0 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">Current Mode: {modeLabel}</div>
                    <div className="text-xs mt-0.5 opacity-75 break-all">
                        {IS_AWS_CONNECTED
                            ? <>Connecting to: <span className="font-mono">{API_BASE_URL}</span></>
                            : <>VITE_API_BASE_URL is not set - all features run with local mock data</>
                        }
                    </div>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded-full font-medium border ${modeColor}`}>
                    {IS_AWS_CONNECTED ? 'Connected' : 'Mock'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {liveChecks.map(check => {
                    const Icon = check.icon;
                    return (
                        <div key={check.path} className={`rounded-xl border p-4 ${check.tone}`}>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Icon size={15} />
                                {check.label}
                            </div>
                            <div className="font-mono text-xs mt-1">{check.path}</div>
                            <div className="text-xs mt-2 opacity-80">{check.status}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                    Frontend Environment
                </h2>
                <p className="text-xs text-gray-500 mb-2">
                    Amplify should set <code className="bg-gray-100 px-1 rounded font-mono">VITE_API_BASE_URL</code> to the live API Gateway URL:
                </p>
                <pre className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-lg overflow-x-auto mobile-safe-text">
                    VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
                </pre>
                <p className="text-xs text-gray-400 mt-2">
                    No AWS credentials or secrets belong in frontend source code.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    AWS Architecture
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                        { icon: Globe, label: 'React + Vite\nTailwind CSS', color: 'text-blue-600 bg-blue-50' },
                        { icon: Cloud, label: 'Amplify / S3', color: 'text-orange-600 bg-orange-50' },
                        { icon: Server, label: 'API Gateway', color: 'text-green-600 bg-green-50' },
                        { icon: Cpu, label: 'AWS Lambda', color: 'text-purple-600 bg-purple-50' },
                        { icon: Database, label: 'DynamoDB', color: 'text-indigo-600 bg-indigo-50' },
                        { icon: FileText, label: 'Bedrock\nClaude 3 Haiku', color: 'text-red-600 bg-red-50' },
                        { icon: Shield, label: 'S3 + CloudWatch', color: 'text-gray-700 bg-gray-100' },
                    ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100">
                            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-[11px] text-gray-600 text-center whitespace-pre-line">{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
                    <Shield size={14} className="mt-0.5 flex-shrink-0" />
                    <span>React + Amplify/S3 -&gt; API Gateway -&gt; Lambda -&gt; DynamoDB -&gt; Bedrock -&gt; S3 -&gt; CloudWatch</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Space Grotesk' }}>
                        API Endpoints
                    </h2>
                </div>
                <div className="sm:hidden p-4 space-y-3">
                    {endpoints.map(ep => (
                        <div key={ep.path} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${methodColors[ep.method]}`}>
                                    {ep.method}
                                </span>
                                <span className="font-mono text-xs text-gray-700 mobile-safe-text text-right">{ep.path}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-2 mobile-safe-text">{ep.description}</div>
                        </div>
                    ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[620px]">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 bg-gray-50">
                                <th className="px-5 py-3 font-medium">Method</th>
                                <th className="px-5 py-3 font-medium">Path</th>
                                <th className="px-5 py-3 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {endpoints.map(ep => (
                                <tr key={ep.path} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${methodColors[ep.method]}`}>
                                            {ep.method}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{ep.path}</td>
                                    <td className="px-5 py-3 text-gray-600">{ep.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    DynamoDB Tables
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dynamoTables.map(table => (
                        <div key={table.name} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Database size={18} className="text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-mono font-medium text-gray-800 mobile-safe-text">{table.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 mobile-safe-text">{table.description}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">Partition key: <span className="font-mono">{table.key}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                    AI Model Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu size={16} className="text-red-600" />
                            <span className="text-sm font-semibold text-red-800">AWS Bedrock</span>
                        </div>
                        <div className="space-y-1 text-xs text-red-700">
                            <div><strong>Model:</strong> Claude 3 Haiku</div>
                            <div className="font-mono text-[11px] break-all mobile-safe-text">{BEDROCK_MODEL_ID}</div>
                            <div className="mt-2 text-[11px] text-red-600">Used for: outreach generation and impact content.</div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={16} className="text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Safety Configuration</span>
                        </div>
                        <div className="space-y-1 text-xs text-blue-700">
                            <div>No medical claims in generated content.</div>
                            <div>No patient PII in outreach messages.</div>
                            <div>No donor health certification.</div>
                            <div>Coordinator final decision preserved.</div>
                            <div>Anonymized impact and awareness content.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <h2 className="text-sm font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                    Production Readiness Notes
                </h2>
                <ul className="space-y-1 text-xs text-amber-700">
                    <li>CloudWatch supports Lambda/API observability and audit trails.</li>
                    <li>AI features route through AWS Bedrock Claude 3 Haiku; no direct Anthropic or OpenAI API calls.</li>
                    <li>DynamoDB is the primary serverless data store for donor, request, conversation, and response records.</li>
                    <li>WhatsApp Business API, role-based access, budget controls, monitoring alerts, and human verification workflow remain future integrations.</li>
                </ul>
            </div>

            <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                <span>Hemolytics prototype architecture. Backend targets AWS API Gateway -&gt; Lambda -&gt; DynamoDB -&gt; Bedrock. Currently running in {modeLabel}.</span>
            </div>
        </div>
    );
}
