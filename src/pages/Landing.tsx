import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Bot, Database, Gauge, HeartPulse, MessageSquare,
    ShieldCheck, Sparkles, Users, Activity, Megaphone, Wifi
} from 'lucide-react';

const workflow = [
    { label: 'Dataset', icon: Database, desc: 'Load donor and request records' },
    { label: 'Dashboard', icon: Gauge, desc: 'See fast demo analytics' },
    { label: 'SmartMatch', icon: Sparkles, desc: 'Rank relevant donors' },
    { label: 'AI Outreach', icon: MessageSquare, desc: 'Draft coordinator copy' },
    { label: 'Responses', icon: Activity, desc: 'Classify and escalate' },
    { label: 'Impact Story', icon: Megaphone, desc: 'Create safe awareness content' },
];

const roadmap = [
    'WhatsApp Business API integration',
    'Patient/coordinator notifications',
    'Community impact stories',
    'Awareness campaigns with nonprofit partners',
    'Human/medical verification workflow',
];

const outcomes = [
    {
        title: 'Dataset Intelligence',
        desc: 'Cleans donor and bridge records, flags data quality gaps, and prepares coordinator-ready profiles.',
    },
    {
        title: 'SmartMatch Donor Prioritization',
        desc: 'Ranks eligible, active donors by blood group, location quality, proximity, engagement, and experience.',
    },
    {
        title: 'AI-Assisted Coordinator Workflow',
        desc: 'Drafts safe outreach, summarizes responses, supports escalation, and creates anonymized awareness content.',
    },
];

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-full bg-gray-50">
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 lg:px-6 py-7 sm:py-10 lg:py-14">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8 items-center">
                        <div className="lg:col-span-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-medium mb-4">
                                <HeartPulse size={14} />
                                Built for Blood Warriors AI for Good Hackathon
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
                                Hemolytics
                            </h1>
                            <p className="mt-2 text-base sm:text-lg lg:text-xl text-gray-800 font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                                AI-powered blood donation coordination for Blood Warriors
                            </p>
                            <p className="mt-4 text-sm lg:text-base text-gray-600 leading-relaxed max-w-2xl">
                                Hemolytics connects urgent blood requests to the most relevant donors using dataset intelligence, SmartMatch ranking, AI-assisted outreach, response tracking, escalation, and safe awareness messaging.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
                                    React + API Gateway + Lambda + DynamoDB + Bedrock + S3 + CloudWatch
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium">
                                    AI assists coordination only
                                </span>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                                <button onClick={() => navigate('/dataset-ingestion')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition">
                                    Start Demo <ArrowRight size={16} />
                                </button>
                                <button onClick={() => navigate('/smartmatch')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">
                                    Run SmartMatch
                                </button>
                                <button onClick={() => navigate('/api-settings')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                                    View AWS Connection <Wifi size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-gray-950 rounded-xl p-4 sm:p-5 text-white shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <Bot size={18} className="text-red-300" />
                                <span className="text-sm font-semibold">Coordination Safety Principle</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                AI assists coordination only. It does not certify donor health, donor eligibility, or blood safety. Final decisions remain with authorized human and medical staff.
                            </p>
                            <div className="mt-5 grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                                    <Users size={18} className="text-red-200 mb-2" />
                                    <div className="text-xs text-gray-300">Prioritize donors for coordinator review</div>
                                </div>
                                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                                    <ShieldCheck size={18} className="text-green-200 mb-2" />
                                    <div className="text-xs text-gray-300">Keep medical decisions human-led</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    {outcomes.map(item => (
                        <div key={item.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{item.title}</h2>
                            <p className="text-xs text-gray-500 leading-relaxed mt-2">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>Final MVP Workflow</h2>
                    <p className="text-sm text-gray-500 mb-4">Follow the demo from data loading through matching, outreach, response handling, and awareness messaging.</p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {workflow.map((step, index) => (
                            <div key={step.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-100">
                                        <step.icon size={18} className="text-[var(--brand-primary)]" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{index + 1}</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-800">{step.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>Future production roadmap</h2>
                    <p className="text-xs text-gray-500 mb-3">Not built into the current MVP. These are practical next steps after the hackathon demo.</p>
                    <div className="flex flex-wrap gap-2">
                        {roadmap.map(item => (
                            <span key={item} className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
