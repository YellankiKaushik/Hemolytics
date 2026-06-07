import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    Activity, Database, Droplets, Heart, Home, LayoutDashboard,
    Menu, MessageSquare, Search, Settings, ShieldAlert, X
} from 'lucide-react';

const SAFETY_NOTE = 'Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with donor prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human/medical staff.';

const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/dataset-ingestion', icon: Database, label: 'Dataset Ingestion' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/smartmatch', icon: Search, label: 'SmartMatch' },
    { to: '/ai-outreach', icon: MessageSquare, label: 'AI Outreach' },
    { to: '/response-tracking', icon: Activity, label: 'Response Tracking' },
    { to: '/impact-story', icon: Heart, label: 'Impact Story' },
    { to: '/api-settings', icon: Settings, label: 'API Settings' },
];

const flowSteps = [
    { label: 'Home', helper: 'Start', path: '/' },
    { label: 'Dataset', helper: 'Load data', path: '/dataset-ingestion' },
    { label: 'Dashboard', helper: 'Readiness', path: '/dashboard' },
    { label: 'SmartMatch', helper: 'Rank donors', path: '/smartmatch' },
    { label: 'Outreach', helper: 'Draft copy', path: '/ai-outreach' },
    { label: 'Responses', helper: 'Classify', path: '/response-tracking' },
    { label: 'Impact', helper: 'Awareness', path: '/impact-story' },
    { label: 'API', helper: 'AWS status', path: '/api-settings' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const location = useLocation();

    return (
        <>
            <div className="flex items-center gap-3 px-5 h-20 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/20">
                    <Droplets size={21} className="text-white" />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-base tracking-wide text-white" style={{ fontFamily: 'Space Grotesk' }}>
                        HEMOLYTICS
                    </div>
                    <div className="text-[11px] text-gray-400">AI Donor Intelligence</div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 min-h-11 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                                ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-red-950/25'
                                : 'text-gray-300 hover:bg-white/8 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Backend</div>
                    <div className="text-xs text-gray-200 leading-relaxed">API Gateway to Lambda to DynamoDB</div>
                    <div className="text-xs text-gray-400 mt-1">Bedrock Claude 3.5 Haiku</div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] text-green-200 border border-green-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        AWS Connected
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [safetyDismissed, setSafetyDismissed] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[280px] flex-col bg-[#1a1a2e] text-white">
                <SidebarContent />
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[84vw] flex-col bg-[#1a1a2e] text-white shadow-2xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-3 z-10 min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl text-gray-300 hover:bg-white/10 hover:text-white"
                            aria-label="Close navigation"
                        >
                            <X size={19} />
                        </button>
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            <div className="min-h-screen min-w-0 md:pl-[280px]">
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
                    <button
                        className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl hover:bg-gray-100"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: 'Space Grotesk' }}>Hemolytics</div>
                        <div className="text-[11px] text-gray-500 truncate">AI Donor Intelligence</div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Ready
                    </div>
                </header>

                {!safetyDismissed && (
                    <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                        <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
                        <span className="flex-1 leading-snug sm:leading-relaxed line-clamp-3 sm:line-clamp-none">{SAFETY_NOTE}</span>
                        <button
                            onClick={() => setSafetyDismissed(true)}
                            className="flex-shrink-0 text-amber-600 hover:text-amber-800 min-h-7 min-w-7 inline-flex items-center justify-center"
                            aria-label="Dismiss safety notice"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="px-3 sm:px-5 py-2.5 bg-white border-b border-gray-100 overflow-x-auto">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
                        {flowSteps.map((step, index) => {
                            const active = location.pathname === step.path;
                            return (
                                <React.Fragment key={step.path}>
                                    <NavLink
                                        to={step.path}
                                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${active
                                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="flex flex-col leading-tight">
                                            <span>{step.label}</span>
                                            <span className={`hidden md:inline text-[10px] font-normal ${active ? 'text-white/75' : 'text-gray-400'}`}>{step.helper}</span>
                                        </span>
                                    </NavLink>
                                    {index < flowSteps.length - 1 && <span className="hidden sm:inline text-gray-300">/</span>}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <main className="min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
