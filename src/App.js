import React from 'react';
import { HashRouter, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimeTrackerPage } from './pages/TimeTrackerPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { AdminApprovalsPage } from './pages/AdminApprovalsPage';
import { AdminTeamPage } from './pages/AdminTeamPage';
import { AdminProjectsPage } from './pages/AdminProjectsPage';
import { DetailedViewPage } from './pages/DetailedViewPage';
import { ReportTimeSheetPage } from './pages/ReportTimeSheetPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MessagingPage } from './pages/MessagingPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <TimerProvider>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/tracker" replace />} />
                    <Route path="tracker" element={<TimeTrackerPage />} />
                    <Route path="timesheets" element={<TimesheetsPage />} />
                    <Route
                      path="admin/approvals"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminApprovalsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="admin/team"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminTeamPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="admin/projects"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminProjectsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="detailed-view" element={<DetailedViewPage />} />
                    <Route path="report-timesheet" element={<ReportTimeSheetPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="messages" element={<MessagingPage />} />
                  </Route>
                </Routes>
                <Toaster position="bottom-right" />
              </div>
            </TimerProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
