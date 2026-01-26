import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Eye, Edit } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminApprovalsPage = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [timesheets, setTimesheets] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [showEditEntryDialog, setShowEditEntryDialog] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState('');
  const [activeTab, setActiveTab] = useState('approvals');
  const [timeEntries, setTimeEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    project_id: '',
    task_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchTimesheets();
    fetchUsers();
    fetchProjects();
  }, [activeTab]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      let url = `${API}/timesheets`;
      if (activeTab === 'approvals') {
        url += '?status=submitted';
      } else if (activeTab === 'approved') {
        url += '?status=approved';
      } else if (activeTab === 'denied') {
        url += '?status=denied';
      }
      // 'all' tab doesn't add a status filter
      
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

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const fetchTasks = async (projectId) => {
    try {
      const response = await axios.get(`${API}/tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchTimeEntries = async (timesheet) => {
    try {
      const response = await axios.get(
        `${API}/time-entries?start_date=${timesheet.week_start}&end_date=${timesheet.week_end}&user_id=${timesheet.user_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTimeEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      toast.error(t('approvals.messages.loadEntriesError'));
    }
  };

  const handleReview = async () => {
    if (reviewAction === 'denied' && !reviewComment.trim()) {
      toast.error(t('approvals.messages.commentRequiredError'));
      return;
    }

    try {
      await axios.put(`${API}/timesheets/${selectedTimesheet.id}/review`, {
        status: reviewAction,
        admin_comment: reviewComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t(`approvals.messages.${reviewAction}`));
      setShowReviewDialog(false);
      setSelectedTimesheet(null);
      setReviewComment('');
      fetchTimesheets();
    } catch (error) {
      toast.error(t('approvals.messages.reviewError'));
    }
  };

  const openReviewDialog = (timesheet, action) => {
    setSelectedTimesheet(timesheet);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const handleViewEntries = async (timesheet) => {
    setSelectedTimesheet(timesheet);
    await fetchTimeEntries(timesheet);
    // Fetch all tasks for display
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
    setShowEntriesDialog(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    const startTime = new Date(entry.start_time).toISOString().slice(0, 16);
    const endTime = new Date(entry.end_time).toISOString().slice(0, 16);
    
    setEditForm({
      project_id: entry.project_id,
      task_id: entry.task_id,
      start_time: startTime,
      end_time: endTime,
      notes: entry.notes || ''
    });
    
    fetchTasks(entry.project_id);
    setShowEditEntryDialog(true);
  };

  const handleEditEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/time-entries/${editingEntry.id}`, {
        ...editForm,
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('approvals.messages.entryUpdated'));
      setShowEditEntryDialog(false);
      setEditingEntry(null);
      // Refresh entries
      if (selectedTimesheet) {
        await fetchTimeEntries(selectedTimesheet);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('approvals.messages.entryUpdateError'));
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6" data-testid="admin-approvals-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('approvals.title')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {t('approvals.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="approvals-tabs">
          <TabsTrigger value="approvals" data-testid="approvals-tab">
            {t('approvals.tabs.approvals')}
            {activeTab === 'approvals' && timesheets.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {timesheets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="approved-tab">{t('approvals.tabs.approved')}</TabsTrigger>
          <TabsTrigger value="denied" data-testid="denied-tab">{t('approvals.tabs.denied')}</TabsTrigger>
          <TabsTrigger value="all" data-testid="all-tab">{t('approvals.tabs.all')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Timesheets Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" data-testid="timesheets-table">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4 align-middle">{t('approvals.table.employee')}</th>
                    <th className="p-4 align-middle">{t('approvals.table.period')}</th>
                    <th className="p-4 align-middle">{t('approvals.table.totalHours')}</th>
                    <th className="p-4 align-middle">{t('approvals.table.status')}</th>
                    <th className="p-4 align-middle">{t('approvals.table.submitted')}</th>
                    <th className="p-4 align-middle">{t('approvals.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-muted-foreground">
                        {t('approvals.messages.loading')}
                      </td>
                    </tr>
                  ) : timesheets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-muted-foreground">
                        {t('approvals.messages.noTimesheets')}
                      </td>
                    </tr>
                  ) : (
                    timesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4 align-middle font-medium">
                          {getUserName(timesheet.user_id)}
                        </td>
                        <td className="p-4 align-middle">
                          {timesheet.week_start} {t('approvals.table.to')} {timesheet.week_end}
                        </td>
                        <td className="p-4 align-middle font-medium">{timesheet.total_hours}h</td>
                        <td className="p-4 align-middle">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            timesheet.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : timesheet.status === 'denied'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {timesheet.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {new Date(timesheet.submitted_at).toLocaleDateString()}
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
                              {t('approvals.buttons.viewEntries')}
                            </Button>
                            {timesheet.status === 'submitted' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openReviewDialog(timesheet, 'approved')}
                                  data-testid={`approve-timesheet-${timesheet.id}`}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {t('approvals.buttons.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openReviewDialog(timesheet, 'denied')}
                                  data-testid={`deny-timesheet-${timesheet.id}`}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  {t('approvals.buttons.deny')}
                                </Button>
                              </>
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent data-testid="review-dialog">
          <DialogHeader>
            <DialogTitle>
              {t(`approvals.dialog.reviewTitle.${reviewAction === 'approved' ? 'approve' : 'deny'}`)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedTimesheet && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">{t('approvals.table.employee')}</div>
                <div className="font-medium mb-3">{getUserName(selectedTimesheet.user_id)}</div>
                <div className="text-sm text-muted-foreground mb-1">{t('approvals.table.period')}</div>
                <div className="font-medium mb-3">
                  {selectedTimesheet.week_start} {t('approvals.table.to')} {selectedTimesheet.week_end}
                </div>
                <div className="text-sm text-muted-foreground mb-1">{t('approvals.table.totalHours')}</div>
                <div className="font-medium">{selectedTimesheet.total_hours}h</div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('approvals.dialog.comment')} {reviewAction === 'denied' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={reviewAction === 'approved' ? t('approvals.dialog.commentOptional') : t('approvals.dialog.commentRequired')}
                rows={4}
                data-testid="review-comment"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleReview}
                className="flex-1"
                data-testid="confirm-review-btn"
              >
                {t(`approvals.dialog.confirm${reviewAction === 'approved' ? 'Approval' : 'Denial'}`)}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Time Entries Dialog */}
      <Dialog open={showEntriesDialog} onOpenChange={setShowEntriesDialog}>
        <DialogContent className="max-w-4xl" data-testid="entries-dialog">
          <DialogHeader>
            <DialogTitle>{t('approvals.dialog.entriesTitle')}</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedTimesheet && (
              <div className="mb-4 bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('approvals.table.employee')}</div>
                    <div className="font-medium">{getUserName(selectedTimesheet.user_id)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('approvals.table.period')}</div>
                    <div className="font-medium">
                      {selectedTimesheet.week_start} {t('approvals.table.to')} {selectedTimesheet.week_end}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('approvals.table.totalHours')}</div>
                    <div className="font-medium">{selectedTimesheet.total_hours}h</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">{t('approvals.dialog.date')}</th>
                    <th className="p-3 text-left">{t('approvals.dialog.time')}</th>
                    <th className="p-3 text-left">{t('timeEntry.project')}</th>
                    <th className="p-3 text-left">{t('timeEntry.task')}</th>
                    <th className="p-3 text-left">{t('approvals.dialog.duration')}</th>
                    <th className="p-3 text-left">{t('timeEntry.notes')}</th>
                    <th className="p-3 text-left">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">
                        {t('approvals.messages.noEntries')}
                      </td>
                    </tr>
                  ) : (
                    timeEntries.map((entry) => {
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
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              data-testid={`edit-entry-${entry.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
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

      {/* Edit Entry Dialog */}
      <Dialog open={showEditEntryDialog} onOpenChange={setShowEditEntryDialog}>
        <DialogContent data-testid="edit-entry-dialog">
          <DialogHeader>
            <DialogTitle>{t('approvals.dialog.editEntryTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditEntrySubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.project')}</label>
              <Select
                value={editForm.project_id || ''}
                onValueChange={(value) => {
                  setEditForm({ ...editForm, project_id: value });
                  fetchTasks(value);
                }}
              >
                <SelectTrigger data-testid="edit-project-select">
                  <SelectValue placeholder={t('approvals.dialog.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.task')}</label>
              <Select
                value={editForm.task_id || ''}
                onValueChange={(value) => setEditForm({ ...editForm, task_id: value })}
              >
                <SelectTrigger data-testid="edit-task-select">
                  <SelectValue placeholder={t('approvals.dialog.selectTask')} />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('timeEntry.startTime')}</label>
                <Input
                  type="datetime-local"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  required
                  data-testid="edit-start-time"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('timeEntry.endTime')}</label>
                <Input
                  type="datetime-local"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  required
                  data-testid="edit-end-time"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.notesOptional')}</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t('timeTracker.addNotes')}
                data-testid="edit-notes"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" data-testid="edit-entry-submit">
                {t('approvals.buttons.saveChanges')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditEntryDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
