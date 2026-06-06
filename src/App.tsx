import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DatasetIngestion from './pages/DatasetIngestion';
import SmartMatch from './pages/SmartMatch';
import AiOutreach from './pages/AiOutreach';
import ResponseTracking from './pages/ResponseTracking';
import ImpactStory from './pages/ImpactStory';
import ApiSettings from './pages/ApiSettings';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dataset" element={<DatasetIngestion />} />
                    <Route path="smartmatch" element={<SmartMatch />} />
                    <Route path="outreach" element={<AiOutreach />} />
                    <Route path="responses" element={<ResponseTracking />} />
                    <Route path="impact" element={<ImpactStory />} />
                    <Route path="api-settings" element={<ApiSettings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
