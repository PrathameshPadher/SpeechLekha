import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { ProductPage } from './pages/ProductPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { OpenSourcePage } from './pages/OpenSourcePage';
import { AppDashboard } from './pages/AppDashboard';
import { KnowledgeVault } from './pages/KnowledgeVault';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { DocumentEditorPage } from './pages/DocumentEditorPage';
import { LiveSpeakingMode } from './pages/LiveSpeakingMode';
import { SessionResult } from './pages/SessionResult';
import { RecentSessionsPage } from './pages/RecentSessionsPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { SearchPage } from './pages/SearchPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { SummaryPage } from './pages/SummaryPage';
import { DiagramPage } from './pages/DiagramPage';
import { QuizPage } from './pages/QuizPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/layout/ToastContainer';

export const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Landing />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/open-source" element={<OpenSourcePage />} />

        {/* VOICE RECORDING */}
        <Route path="/speak" element={<LiveSpeakingMode />} />

        {/* MAIN WORKSPACE & VAULT */}
        <Route path="/app" element={<AppDashboard />} />
        <Route path="/vault" element={<KnowledgeVault />} />

        {/* DOCUMENT VIEWER & EDITOR */}
        <Route path="/document/:id" element={<DocumentViewerPage />} />
        <Route path="/document/:id/edit" element={<DocumentEditorPage />} />
        <Route path="/document" element={<Navigate to="/document/01-photosynthesis" replace />} />

        {/* SESSIONS */}
        <Route path="/session/:id" element={<SessionResult />} />
        <Route path="/session" element={<Navigate to="/session/demo" replace />} />
        <Route path="/sessions" element={<RecentSessionsPage />} />

        {/* GRAPH & DISCOVERY */}
        <Route path="/graph" element={<KnowledgeGraphPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/connections/:id" element={<ConnectionsPage />} />
        <Route path="/connections" element={<Navigate to="/connections/Photosynthesis" replace />} />

        {/* AI CAPABILITIES & TOOLS */}
        <Route path="/summary/:id" element={<SummaryPage />} />
        <Route path="/summary" element={<Navigate to="/summary/01-photosynthesis" replace />} />
        <Route path="/diagram" element={<DiagramPage />} />
        <Route path="/quiz" element={<QuizPage />} />

        {/* SYSTEM & PROFILE */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CommandPalette />
      <ToastContainer />
    </>
  );
};
