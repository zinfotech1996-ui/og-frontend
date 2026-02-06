import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Users, FileText, FolderKanban, Clock, TrendingUp, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DashboardPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActiveTimersModal, setShowActiveTimersModal] = useState(false);
  const [activeTimers, setActiveTimers] = useState([]);
  const [loadingTimers, setLoadingTimers] = useState(false);

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

  const fetchActiveTimers = async () => {
    setLoadingTimers(true);
    try {
      const response = await axios.get(`${API}/timers/active-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveTimers(response.data);
    } catch (error) {
      console.error('Failed to fetch active timers:', error);
    } finally {
      setLoadingTimers(false);
    }
  };

  const handleActiveTimersClick = async () => {
    setShowActiveTimersModal(true);
    await fetchActiveTimers();
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
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
          {t('dashboard.welcome')}, {user?.name}!
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {isAdmin ? t('dashboard.overviewAdmin') : t('dashboard.overviewEmployee')}
        </p>
      </div>

      {/* Stats Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Total Employees Card */}
          <div 
            onClick={() => navigate('/admin/team')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-total-employees"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.totalEmployees')}</div>
            <div className="text-3xl font-bold">{stats?.total_employees || 0}</div>
            <div className="text-xs text-primary mt-2">{t('dashboard.clickToViewTeam')}</div>
          </div>

          {/* Active Employees Card */}
          <div 
            onClick={() => navigate('/admin/team')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-active-employees"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.activeEmployees')}</div>
            <div className="text-3xl font-bold">{stats?.active_employees || 0}</div>
            <div className="text-xs text-green-600 mt-2">{t('dashboard.clickToViewTeam')}</div>
          </div>

          {/* Pending Approvals Card */}
          <div 
            onClick={() => navigate('/admin/approvals')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-pending-timesheets"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.pendingApprovals')}</div>
            <div className="text-3xl font-bold">{stats?.pending_timesheets || 0}</div>
            <div className="text-xs text-yellow-600 mt-2">{t('dashboard.clickToReview')}</div>
          </div>

          {/* Total Projects Card */}
          <div 
            onClick={() => navigate('/admin/projects')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-total-projects"
          >
            <div className="flex items-center justify-between mb-4">
              <FolderKanban className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.totalProjects')}</div>
            <div className="text-3xl font-bold">{stats?.total_projects || 0}</div>
            <div className="text-xs text-blue-600 mt-2">{t('dashboard.clickToManage')}</div>
          </div>

          {/* Active Timers Card */}
          <div 
            onClick={handleActiveTimersClick}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-active-timers"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-green-500 animate-pulse" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.activeTimers')}</div>
            <div className="text-3xl font-bold">{stats?.active_timers || 0}</div>
            <div className="text-xs text-green-600 mt-2">{t('dashboard.clickToViewDetails')}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/tracker')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-today-hours"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.todayHours')}</div>
            <div className="text-3xl font-bold">{stats?.today_hours || 0}</div>
            <div className="text-xs text-primary mt-2">{t('dashboard.clickToTrackTime')}</div>
          </div>

          <div 
            onClick={() => navigate('/timesheets')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-week-hours"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.weekHours')}</div>
            <div className="text-3xl font-bold">{stats?.week_hours || 0}</div>
            <div className="text-xs text-green-600 mt-2">{t('dashboard.clickToViewTimesheets')}</div>
          </div>

          <div 
            onClick={() => navigate('/tracker')}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer" 
            data-testid="stat-total-entries"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground mb-1">{t('dashboard.weekEntries')}</div>
            <div className="text-3xl font-bold">{stats?.total_entries || 0}</div>
            <div className="text-xs text-blue-600 mt-2">{t('dashboard.clickToViewEntries')}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {/* <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('dashboard.quickActions')}
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
                <div className="font-medium">{t('dashboard.reviewTimesheets')}</div>
              </a>
              <a
                href="/admin/team"
                data-testid="quick-action-team"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">{t('dashboard.manageTeam')}</div>
              </a>
              <a
                href="/reports"
                data-testid="quick-action-reports"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">{t('dashboard.viewReports')}</div>
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
                <div className="font-medium">{t('dashboard.timeTracker')}</div>
              </a>
              <a
                href="/timesheets"
                data-testid="quick-action-timesheets"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">{t('dashboard.myTimesheets')}</div>
              </a>
              <a
                href="/reports"
                data-testid="quick-action-reports"
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium">{t('dashboard.myReports')}</div>
              </a>
            </>
          )}
        </div>
      </div> */}

      {/* Active Timers Modal */}
      <Dialog open={showActiveTimersModal} onOpenChange={setShowActiveTimersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="active-timers-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500 animate-pulse" />
              {t('dashboard.activeTimersModal')} ({activeTimers.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {loadingTimers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeTimers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noActiveTimers')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTimers.map((timer) => (
                  <div 
                    key={timer.id} 
                    className="bg-muted/50 border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                    data-testid={`active-timer-${timer.user_id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                            {timer.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{timer.user_name || t('dashboard.unknownUser')}</p>
                            <p className="text-xs text-muted-foreground truncate">{timer.user_email || ''}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{timer.project_name || t('dashboard.unknownProject')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{timer.task_name || t('dashboard.unknownTask')}</span>
                          </div>
                          {timer.notes && (
                            <div className="flex items-start gap-2 mt-2">
                              <span className="text-muted-foreground italic text-xs">"{timer.notes}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">{t('dashboard.runningFor')}</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatDuration(timer.start_time)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('dashboard.started')}: {new Date(timer.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
