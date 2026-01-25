import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Users, FileText, FolderKanban, Clock, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DashboardPage = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Welcome back, {user?.name}!
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {isAdmin ? 'Overview of your team performance' : 'Track your time and manage your work'}
        </p>
      </div>

      {/* Stats Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-total-employees">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Total Employees</div>
            <div className="text-3xl font-bold">{stats?.total_employees || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-active-employees">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Active Employees</div>
            <div className="text-3xl font-bold">{stats?.active_employees || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-pending-timesheets">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Pending Approvals</div>
            <div className="text-3xl font-bold">{stats?.pending_timesheets || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-total-projects">
            <div className="flex items-center justify-between mb-4">
              <FolderKanban className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Total Projects</div>
            <div className="text-3xl font-bold">{stats?.total_projects || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-active-timers">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-green-500 animate-pulse" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Active Timers</div>
            <div className="text-3xl font-bold">{stats?.active_timers || 0}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-today-hours">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Today's Hours</div>
            <div className="text-3xl font-bold">{stats?.today_hours || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-week-hours">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">This Week's Hours</div>
            <div className="text-3xl font-bold">{stats?.week_hours || 0}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid="stat-total-entries">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Week Entries</div>
            <div className="text-3xl font-bold">{stats?.total_entries || 0}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAdmin ? (
            <>
              <a
                href="/admin/approvals"
                data-testid="quick-action-approvals"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">Review Timesheets</div>
              </a>
              <a
                href="/admin/team"
                data-testid="quick-action-team"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">Manage Team</div>
              </a>
              <a
                href="/reports"
                data-testid="quick-action-reports"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">View Reports</div>
              </a>
            </>
          ) : (
            <>
              <a
                href="/tracker"
                data-testid="quick-action-tracker"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">Time Tracker</div>
              </a>
              <a
                href="/timesheets"
                data-testid="quick-action-timesheets"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">My Timesheets</div>
              </a>
              <a
                href="/reports"
                data-testid="quick-action-reports"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">My Reports</div>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
