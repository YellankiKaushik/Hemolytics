import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
    LayoutDashboard, Database, Search, MessageSquare, Activity,
    Heart, Settings, ChevronLeft, ChevronRight, Droplets, Menu, X, ShieldAlert
} from 'lucide-react';

const SAFETY_NOTE = 'Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with donor prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human/medical staff.';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dataset', icon: Database, label: 'Dataset Ingestion' },
    { to: '/smartmatch', icon: Search, label: 'SmartMatch' },
    { to: '/outreach', icon: MessageSquare, label: 'AI Outreach' },
    { to: '/responses', icon: Activity, label: 'Response Tracking' },
    { to: '/impact', icon: Heart, label: 'Impact Story' },
    { to: '/api-settings', icon: Settings, label: 'API Settings' },
];

export default function Layout() {
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [safetyDismissed, setSafetyDismissed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col bg-[#1a1a2e] text-white transition-all duration-300
          ${sidebarOpen ? 'w-60' : 'w-16'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                        <Droplets size={18} className="text-white" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>
                                HEMOLYTICS
                            </span>
                            <span className="text-[10px] text-gray-400">AI Donor Intelligence</span>
                        </div>
                    )}
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
                                {sidebarOpen && <span className="truncate">{item.label}</span>}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Backend label */}
                {sidebarOpen && (
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
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden p-1 rounded hover:bg-gray-100"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden lg:block" />

                    {/* Right side badges */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-600">Prototype Ready</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs text-blue-700 border border-blue-200">
                            <span>Bedrock Claude 3 Haiku</span>
                        </div>
                    </div>
                </header>

                {/* Safety Banner */}
                {!safetyDismissed && (
                    <div className="flex items-start gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                        <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
                        <span className="flex-1 leading-relaxed">{SAFETY_NOTE}</span>
                        <button
                            onClick={() => setSafetyDismissed(true)}
                            className="flex-shrink-0 text-amber-600 hover:text-amber-800 ml-2"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
