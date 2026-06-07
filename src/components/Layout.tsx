import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
    LayoutDashboard, Database, Search, MessageSquare, Activity,
    Heart, Settings, ChevronLeft, ChevronRight, Droplets, Menu, X, ShieldAlert, Home
} from 'lucide-react';

const SAFETY_NOTE = 'Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with donor prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human/medical staff.';

const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dataset-ingestion', icon: Database, label: 'Dataset Ingestion' },
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

export default function Layout() {
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [safetyDismissed, setSafetyDismissed] = useState(false);
    const showSidebarLabels = sidebarOpen || mobileOpen;

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col bg-[#1a1a2e] text-white transition-all duration-300
          w-72 max-w-[82vw] lg:max-w-none ${sidebarOpen ? 'lg:w-60' : 'lg:w-16'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                        <Droplets size={18} className="text-white" />
                    </div>
                    {showSidebarLabels && (
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>
                                HEMOLYTICS
                            </span>
                            <span className="text-[10px] text-gray-400">AI Donor Intelligence</span>
                        </div>
                    )}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="ml-auto lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
                        aria-label="Close navigation"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.to;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all
                  ${active
                                        ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-red-900/30'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }
                `}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {showSidebarLabels && <span className="truncate">{item.label}</span>}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Backend label */}
                {showSidebarLabels && (
                    <div className="px-4 py-3 border-t border-white/10">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Backend</div>
                        <div className="text-[11px] text-gray-400">API Gateway → Lambda → DynamoDB</div>
                        <div className="text-[11px] text-gray-400">Bedrock Claude 3 Haiku</div>
                    </div>
                )}

                {/* Collapse toggle (desktop only) */}
                <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex items-center justify-center h-10 border-t border-white/10 text-gray-400 hover:text-white transition"
                >
                    {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg hover:bg-gray-100"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="lg:hidden min-w-0 flex-1 px-3">
                        <div className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: 'Space Grotesk' }}>Hemolytics</div>
                    </div>
                    <div className="hidden lg:block flex-1" />

                    {/* Right side badges */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-gray-100 text-xs whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-600 hidden xs:inline">Prototype Ready</span>
                            <span className="text-gray-600 xs:hidden">Ready</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs text-blue-700 border border-blue-200">
                            <span>Bedrock Claude 3 Haiku</span>
                        </div>
                    </div>
                </header>

                {/* Safety Banner */}
                {!safetyDismissed && (
                    <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                        <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
                        <span className="flex-1 leading-snug sm:leading-relaxed line-clamp-3 sm:line-clamp-none">{SAFETY_NOTE}</span>
                        <button
                            onClick={() => setSafetyDismissed(true)}
                            className="flex-shrink-0 text-amber-600 hover:text-amber-800 ml-1 min-h-7 min-w-7 inline-flex items-center justify-center"
                            aria-label="Dismiss safety notice"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-100 overflow-x-auto">
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

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
