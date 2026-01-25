import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const [activeTab, setActiveTab] = useState('submitted');
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
      let url = `${API}/timesheets`;
      if (activeTab === 'submitted') {
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
      toast.error('Failed to load time entries');
    }
  };

  const handleReview = async () => {
    if (reviewAction === 'denied' && !reviewComment.trim()) {
      toast.error('Comment is required when denying a timesheet');
      return;
    }

    try {
      await axios.put(`${API}/timesheets/${selectedTimesheet.id}/review`, {
        status: reviewAction,
        admin_comment: reviewComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Timesheet ${reviewAction}`);
      setShowReviewDialog(false);
      setSelectedTimesheet(null);
      setReviewComment('');
      fetchTimesheets();
    } catch (error) {
      toast.error('Failed to review timesheet');
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
      toast.success('Time entry updated');
      setShowEditEntryDialog(false);
      setEditingEntry(null);
      // Refresh entries
      if (selectedTimesheet) {
        await fetchTimeEntries(selectedTimesheet);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update entry');
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
          Timesheet Approvals
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Review and approve employee timesheets
        </p>
      </div>

      {/* Pending Count */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{timesheets.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Pending Approvals</div>
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left" data-testid="pending-timesheets-table">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="p-4 align-middle">Employee</th>
                <th className="p-4 align-middle">Period</th>
                <th className="p-4 align-middle">Total Hours</th>
                <th className="p-4 align-middle">Submitted</th>
                <th className="p-4 align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : timesheets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">
                    No pending timesheets
                  </td>
                </tr>
              ) : (
                timesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-middle font-medium">
                      {getUserName(timesheet.user_id)}
                    </td>
                    <td className="p-4 align-middle">
                      {timesheet.week_start} to {timesheet.week_end}
                    </td>
                    <td className="p-4 align-middle font-medium">{timesheet.total_hours}h</td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(timesheet.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openReviewDialog(timesheet, 'approved')}
                          data-testid={`approve-timesheet-${timesheet.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReviewDialog(timesheet, 'denied')}
                          data-testid={`deny-timesheet-${timesheet.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent data-testid="review-dialog">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approved' ? 'Approve' : 'Deny'} Timesheet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedTimesheet && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Employee</div>
                <div className="font-medium mb-3">{getUserName(selectedTimesheet.user_id)}</div>
                <div className="text-sm text-muted-foreground mb-1">Period</div>
                <div className="font-medium mb-3">
                  {selectedTimesheet.week_start} to {selectedTimesheet.week_end}
                </div>
                <div className="text-sm text-muted-foreground mb-1">Total Hours</div>
                <div className="font-medium">{selectedTimesheet.total_hours}h</div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Comment {reviewAction === 'denied' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={reviewAction === 'approved' ? 'Optional comment...' : 'Required: Reason for denial'}
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
                Confirm {reviewAction === 'approved' ? 'Approval' : 'Denial'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
