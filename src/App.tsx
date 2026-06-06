import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
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
                    <Route index element={<Landing />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dataset-ingestion" element={<DatasetIngestion />} />
                    <Route path="dataset" element={<Navigate to="/dataset-ingestion" replace />} />
                    <Route path="smartmatch" element={<SmartMatch />} />
                    <Route path="ai-outreach" element={<AiOutreach />} />
                    <Route path="outreach" element={<Navigate to="/ai-outreach" replace />} />
                    <Route path="response-tracking" element={<ResponseTracking />} />
                    <Route path="responses" element={<Navigate to="/response-tracking" replace />} />
                    <Route path="impact-story" element={<ImpactStory />} />
                    <Route path="impact" element={<Navigate to="/impact-story" replace />} />
                    <Route path="api-settings" element={<ApiSettings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
