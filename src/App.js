import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import frFR from 'antd/locale/fr_FR';
import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages - Import direct pour les composants critiques
import Login from './pages/Login/Login';

// Lazy loading pour les autres pages
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Carte = lazy(() => import('./pages/Carte/Carte'));
const Missions = lazy(() => import('./pages/Missions/Missions'));
const MissionDetails = lazy(() => import('./pages/Missions/MissionDetails'));
const NouvelleMission = lazy(() => import('./pages/Missions/NouvelleMission'));
const SelecteurZone = lazy(() => import('./pages/Missions/SelecteurZone'));
const Actions = lazy(() => import('./pages/Actions/Actions'));
const NouvelleAction = lazy(() => import('./pages/Actions/NouvelleAction'));
const ActionCreate = lazy(() => import('./pages/Actions/ActionCreate'));
const PVEditor = lazy(() => import('./pages/Actions/PVEditor'));
const Changements = lazy(() => import('./pages/Changements/Changements'));
const ChangementCreate = lazy(() => import('./pages/Changements/ChangementCreate'));
const Utilisateurs = lazy(() => import('./pages/Utilisateurs/Utilisateurs'));
const Stats = lazy(() => import('./pages/Stats/Stats'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// Composant de fallback pour Suspense
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh'
  }}>
    <Spin size="large" tip="Chargement..." />
  </div>
);

function App() {
  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        token: { colorPrimary: '#1890ff', borderRadius: 6, fontSize: 14 },
        components: {
          Layout: { siderBg: '#001529', headerBg: '#ffffff' },
          Menu: { darkItemBg: 'transparent', darkItemSelectedBg: '#1890ff' }
        }
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />

                {/* Private + Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="carte" element={<Carte />} />

                  {/* Missions */}
                  <Route path="missions" element={<Missions />} />
                  <Route path="missions/:id" element={<MissionDetails />} />
                  <Route
                    path="missions/nouveau"
                    element={
                      <ProtectedRoute requiredPermission="canCreateMissions">
                        <NouvelleMission />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="missions/selecteur-zone"
                    element={
                      <ProtectedRoute requiredPermission="canCreateMissions">
                        <SelecteurZone />
                      </ProtectedRoute>
                    }
                  />

                  {/* Actions */}
                  <Route
                    path="actions"
                    element={
                      <ProtectedRoute requiredPermission="canCreateActions">
                        <Actions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="actions/nouveau"
                    element={
                      <ProtectedRoute requiredPermission="canCreateActions">
                        <NouvelleAction />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="actions/create"
                    element={
                      <ProtectedRoute requiredPermission="canCreateActions">
                        <ActionCreate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="actions/pv/:pvId"
                    element={
                      <ProtectedRoute requiredPermission="canCreateActions">
                        <PVEditor />
                      </ProtectedRoute>
                    }
                  />

                  {/* Changements */}
                  <Route
                    path="changements"
                    element={
                      <ProtectedRoute requiredPermission="canViewChangements">
                        <Changements />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="changements/nouveau"
                    element={
                      <ProtectedRoute requiredPermission="canCreateChangements">
                        <ChangementCreate />
                      </ProtectedRoute>
                    }
                  />

                  {/* Users / Stats */}
                  <Route
                    path="utilisateurs"
                    element={
                      <ProtectedRoute requiredPermission="canManageUsers">
                        <Utilisateurs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="stats"
                    element={
                      <ProtectedRoute requiredPermission="canViewStats">
                        <Stats />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="statistiques"
                    element={
                      <ProtectedRoute requiredPermission="canViewStats">
                        <Stats />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;