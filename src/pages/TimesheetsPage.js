import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Send, RotateCcw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TimesheetsPage = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [timesheetEntries, setTimesheetEntries] = useState([]);

  useEffect(() => {
    fetchTimesheets();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [activeTab]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      let url = `${API}/timesheets`;
      
      // For Open tab, get draft timesheets or all timesheets without draft filter
      if (activeTab === 'open') {
        // Get all timesheets that are not submitted/approved/denied
        url += '?status=draft';
      } else if (activeTab === 'submitted') {
        url += '?status=submitted';
      } else if (activeTab === 'approved') {
        url += '?status=approved';
      } else if (activeTab === 'denied') {
        url += '?status=denied';
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleSubmitTimesheet = async (timesheet) => {
    try {
      await axios.post(`${API}/timesheets/submit`, {
        week_start: timesheet.week_start,
        week_end: timesheet.week_end
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('timesheets.timesheetSubmitted'));
      fetchTimesheets();
      setActiveTab('submitted');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('timesheets.failedToSubmit'));
    }
  };

  const handleViewEntries = async (timesheet) => {
    try {
      setSelectedTimesheet(timesheet);
      const response = await axios.get(`${API}/timesheets/${timesheet.id}/entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheetEntries(response.data);
      
      // Fetch projects and tasks for display
      await fetchProjects();
      await fetchTasks();
      
      setShowEntriesDialog(true);
    } catch (error) {
      console.error('Failed to fetch timesheet entries:', error);
      toast.error(t('timesheets.failedToLoadEntries'));
    }
  };

  const handleReopenTimesheet = async (timesheetId) => {
    try {
      await axios.put(`${API}/timesheets/${timesheetId}/reopen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('timesheets.timesheetReopened'));
      fetchTimesheets();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('timesheets.failedToReopen'));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      denied: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
        {t(`timesheets.${status}`)}
      </span>
    );
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6" data-testid="timesheets-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('timesheets.title')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {t('timesheets.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="timesheets-tabs">
          <TabsTrigger value="open" data-testid="open-tab">
            {t('timesheets.open')}
          </TabsTrigger>
          <TabsTrigger value="submitted" data-testid="submitted-tab">
            {t('timesheets.submitted')}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="approved-tab">
            {t('timesheets.approved')}
          </TabsTrigger>
          <TabsTrigger value="denied" data-testid="denied-tab">
            {t('timesheets.denied')}
          </TabsTrigger>
        </TabsList>

        {/* All Tabs Content */}
        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {activeTab === 'open' ? t('timesheets.draftTimesheets') : t(`timesheets.${activeTab}Timesheets`)}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" data-testid="timesheets-table">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4 align-middle">{t('timesheets.payPeriod')}</th>
                    {/* <th className="p-4 align-middle">Project</th>
                    <th className="p-4 align-middle">Task</th> */}
                    <th className="p-4 align-middle">{t('timesheets.totalHours')}</th>
                    <th className="p-4 align-middle">{t('timesheets.notes')}</th>
                    {activeTab !== 'open' && <th className="p-4 align-middle">{t('timesheets.status')}</th>}
                    {activeTab !== 'open' && <th className="p-4 align-middle">{t('timesheets.comment')}</th>}
                    <th className="p-4 align-middle">{t('timesheets.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === 'open' ? '6' : '8'} className="p-8 text-center text-muted-foreground">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : timesheets.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'open' ? '6' : '8'} className="p-8 text-center text-muted-foreground">
                        {activeTab === 'open' ? t('timesheets.noDraftTimesheets') : t(`timesheets.no${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Timesheets`)}
                      </td>
                    </tr>
                  ) : (
                    timesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4 align-middle font-medium">
                          {timesheet.week_start} – {timesheet.week_end}
                        </td>
                        {/* <td className="p-4 align-middle text-muted-foreground">-</td>
                        <td className="p-4 align-middle text-muted-foreground">-</td> */}
                        <td className="p-4 align-middle font-medium">{timesheet.total_hours}h</td>
                        <td className="p-4 align-middle text-muted-foreground">-</td>
                        {activeTab !== 'open' && (
                          <>
                            <td className="p-4 align-middle">{getStatusBadge(timesheet.status)}</td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {timesheet.admin_comment || '-'}
                            </td>
                          </>
                        )}
                        <td className="p-4 align-middle">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewEntries(timesheet)}
                              data-testid={`view-entries-${timesheet.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('timesheets.view')}
                            </Button>
                            {activeTab === 'open' && (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitTimesheet(timesheet)}
                                data-testid={`submit-timesheet-${timesheet.id}`}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {t('timesheets.submitButton')}
                              </Button>
                            )}
                            {(timesheet.status === 'approved' || timesheet.status === 'denied') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReopenTimesheet(timesheet.id)}
                                data-testid={`reopen-timesheet-${timesheet.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {t('timesheets.reopen')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Time Entries Dialog */}
      <Dialog open={showEntriesDialog} onOpenChange={setShowEntriesDialog}>
        <DialogContent className="max-w-4xl" data-testid="entries-dialog">
          <DialogHeader>
            <DialogTitle>{t('timesheets.timeEntries')}</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedTimesheet && (
              <div className="mb-4 bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('timesheets.payPeriod')}</div>
                    <div className="font-medium">
                      {selectedTimesheet.week_start} – {selectedTimesheet.week_end}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('timesheets.totalHours')}</div>
                    <div className="font-medium">{selectedTimesheet.total_hours}h</div>
                  </div>
                  {selectedTimesheet.status && (
                    <div>
                      <div className="text-sm text-muted-foreground">{t('timesheets.status')}</div>
                      <div>{getStatusBadge(selectedTimesheet.status)}</div>
                    </div>
                  )}
                </div>
                {selectedTimesheet.admin_comment && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground">{t('timesheets.adminComment')}</div>
                    <div className="font-medium mt-1">{selectedTimesheet.admin_comment}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">{t('timesheets.date')}</th>
                    <th className="p-3 text-left">{t('timesheets.startTime')}</th>
                    <th className="p-3 text-left">{t('timesheets.project')}</th>
                    <th className="p-3 text-left">{t('timesheets.task')}</th>
                    <th className="p-3 text-left">{t('timesheets.duration')}</th>
                    <th className="p-3 text-left">{t('timesheets.notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheetEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-muted-foreground">
                        {t('timesheets.noTimeEntries')}
                      </td>
                    </tr>
                  ) : (
                    timesheetEntries.map((entry) => {
                      const project = projects.find(p => p.id === entry.project_id);
                      const task = tasks.find(t => t.id === entry.task_id);
                      
                      return (
                        <tr key={entry.id} className="border-t hover:bg-muted/20">
                          <td className="p-3">{entry.date}</td>
                          <td className="p-3">
                            {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">{project?.name || t('timeEntry.project')}</td>
                          <td className="p-3">{task?.name || t('timeEntry.task')}</td>
                          <td className="p-3 font-medium">{formatDuration(entry.duration)}</td>
                          <td className="p-3 text-muted-foreground">{entry.notes || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
