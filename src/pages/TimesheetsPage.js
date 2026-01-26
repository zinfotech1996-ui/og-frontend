import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Send, Eye, RotateCcw, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TimesheetsPage = () => {
  const { token } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState('open');
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [timesheetEntries, setTimesheetEntries] = useState([]);

  useEffect(() => {
    // Set current week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    setSelectedWeek({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    });

    fetchTimesheets();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [activeTab]);

  useEffect(() => {
    if (selectedWeek.start && selectedWeek.end && activeTab === 'open') {
      fetchWeekEntries();
    }
  }, [selectedWeek, activeTab]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      let url = `${API}/timesheets`;
      
      if (activeTab === 'submitted') {
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

  const fetchWeekEntries = async () => {
    try {
      const response = await axios.get(`${API}/time-entries?start_date=${selectedWeek.start}&end_date=${selectedWeek.end}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
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

  const handleSubmitTimesheet = async () => {
    try {
      await axios.post(`${API}/timesheets/submit`, {
        week_start: selectedWeek.start,
        week_end: selectedWeek.end
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Timesheet submitted for approval');
      fetchTimesheets();
      setActiveTab('submitted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit timesheet');
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
      toast.error('Failed to load timesheet entries');
    }
  };

  const handleReopenTimesheet = async (timesheetId) => {
    try {
      await axios.put(`${API}/timesheets/${timesheetId}/reopen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Timesheet reopened to draft status');
      fetchTimesheets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reopen timesheet');
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + (entry.duration / 3600), 0).toFixed(2);

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      denied: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
        {status}
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
          My Timesheets
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Review and submit your weekly timesheets
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="timesheets-tabs">
          <TabsTrigger value="open" data-testid="open-tab">
            <Clock className="h-4 w-4 mr-2" />
            Open
          </TabsTrigger>
          <TabsTrigger value="submitted" data-testid="submitted-tab">
            Submitted
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="approved-tab">
            Approved
          </TabsTrigger>
          <TabsTrigger value="denied" data-testid="denied-tab">
            Denied
          </TabsTrigger>
        </TabsList>

        {/* Open Tab - Current Week Time Entries */}
        <TabsContent value="open" className="mt-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Current Week
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedWeek.start} to {selectedWeek.end}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{totalHours}h</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{entries.length} time entries</div>
                <div className="text-xs text-muted-foreground">Ready to submit</div>
              </div>
              <Button onClick={handleSubmitTimesheet} data-testid="submit-timesheet-btn">
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </div>

            {/* Time Entries Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Task</th>
                    <th className="p-3 text-left">Duration</th>
                    <th className="p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-muted-foreground">
                        No time entries for this week
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const project = projects.find(p => p.id === entry.project_id);
                      const task = tasks.find(t => t.id === entry.task_id);
                      
                      return (
                        <tr key={entry.id} className="border-t hover:bg-muted/20">
                          <td className="p-3">{entry.date}</td>
                          <td className="p-3">
                            {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">{project?.name || 'No Project'}</td>
                          <td className="p-3">{task?.name || 'No Task'}</td>
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
        </TabsContent>

        {/* Submitted, Approved, Denied Tabs */}
        <TabsContent value={activeTab} className="mt-6">
          {activeTab !== 'open' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Timesheets
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" data-testid="timesheets-table">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-4 align-middle">Period</th>
                      <th className="p-4 align-middle">Total Hours</th>
                      <th className="p-4 align-middle">Status</th>
                      <th className="p-4 align-middle">Submitted</th>
                      <th className="p-4 align-middle">Comment</th>
                      <th className="p-4 align-middle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : timesheets.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          No {activeTab} timesheets
                        </td>
                      </tr>
                    ) : (
                      timesheets.map((timesheet) => (
                        <tr key={timesheet.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="p-4 align-middle">
                            {timesheet.week_start} to {timesheet.week_end}
                          </td>
                          <td className="p-4 align-middle font-medium">{timesheet.total_hours}h</td>
                          <td className="p-4 align-middle">{getStatusBadge(timesheet.status)}</td>
                          <td className="p-4 align-middle text-muted-foreground">
                            {timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground">
                            {timesheet.admin_comment || '-'}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewEntries(timesheet)}
                                data-testid={`view-entries-${timesheet.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {(timesheet.status === 'approved' || timesheet.status === 'denied') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReopenTimesheet(timesheet.id)}
                                  data-testid={`reopen-timesheet-${timesheet.id}`}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reopen
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
          )}
        </TabsContent>
      </Tabs>

      {/* View Time Entries Dialog */}
      <Dialog open={showEntriesDialog} onOpenChange={setShowEntriesDialog}>
        <DialogContent className="max-w-4xl" data-testid="entries-dialog">
          <DialogHeader>
            <DialogTitle>Time Entries</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedTimesheet && (
              <div className="mb-4 bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Period</div>
                    <div className="font-medium">
                      {selectedTimesheet.week_start} to {selectedTimesheet.week_end}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                    <div className="font-medium">{selectedTimesheet.total_hours}h</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div>{getStatusBadge(selectedTimesheet.status)}</div>
                  </div>
                </div>
                {selectedTimesheet.admin_comment && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground">Admin Comment</div>
                    <div className="font-medium mt-1">{selectedTimesheet.admin_comment}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Project</th>
                    <th className="p-3 text-left">Task</th>
                    <th className="p-3 text-left">Duration</th>
                    <th className="p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheetEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-muted-foreground">
                        No time entries found
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
                          <td className="p-3">{project?.name || 'No Project'}</td>
                          <td className="p-3">{task?.name || 'No Task'}</td>
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
