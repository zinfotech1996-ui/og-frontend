import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar, Trash2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TimeTrackerPage = () => {
  const { token, user } = useAuth();
  const { refreshTimer, registerOnStopCallback } = useTimer();
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Store all tasks for display
  const [loading, setLoading] = useState(true);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingEntry, setEditingEntry] = useState(null);

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    project_id: '',
    task_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    project_id: '',
    task_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchEntries();
  }, [selectedDate]);

  // Register callback to refresh entries when timer stops
  useEffect(() => {
    if (registerOnStopCallback) {
      const unregister = registerOnStopCallback(() => {
        // Refresh entries when timer stops
        fetchEntries();
      });
      return unregister;
    }
  }, [registerOnStopCallback]);

  useEffect(() => {
    // Fetch all tasks when projects are loaded
    if (projects.length > 0) {
      fetchAllTasks();
    }
  }, [projects]);

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

  const fetchAllTasks = async () => {
    try {
      // Fetch all tasks from all projects
      const taskPromises = projects.map(project =>
        axios.get(`${API}/tasks?project_id=${project.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      const responses = await Promise.all(taskPromises);
      const allTasksData = responses.flatMap(response => response.data);
      setAllTasks(allTasksData);
    } catch (error) {
      console.error('Failed to fetch all tasks:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API}/time-entries?start_date=${selectedDate}&end_date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm(t('timeEntry.deleteConfirm'))) return;
    
    try {
      await axios.delete(`${API}/time-entries/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('timeEntry.entryDeleted'));
      fetchEntries();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    // Format datetime-local values
    const startTime = new Date(entry.start_time).toISOString().slice(0, 16);
    const endTime = new Date(entry.end_time).toISOString().slice(0, 16);
    
    setEditForm({
      project_id: entry.project_id || 'none',
      task_id: entry.task_id || 'none',
      start_time: startTime,
      end_time: endTime,
      notes: entry.notes || ''
    });
    
    // Load tasks for the selected project if it exists
    if (entry.project_id) {
      fetchTasks(entry.project_id);
    } else {
      setTasks([]);
    }
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/time-entries/${editingEntry.id}`, {
        project_id: editForm.project_id || null,
        task_id: editForm.task_id || null,
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString(),
        notes: editForm.notes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('timeEntry.entryUpdated'));
      setShowEditDialog(false);
      setEditingEntry(null);
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update entry');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/time-entries/manual`, {
        project_id: manualForm.project_id && manualForm.project_id !== 'none' ? manualForm.project_id : null,
        task_id: manualForm.task_id && manualForm.task_id !== 'none' ? manualForm.task_id : null,
        start_time: new Date(manualForm.start_time).toISOString(),
        end_time: new Date(manualForm.end_time).toISOString(),
        notes: manualForm.notes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('timeEntry.entryCreated'));
      setShowManualDialog(false);
      setManualForm({ project_id: '', task_id: '', start_time: '', end_time: '', notes: '' });
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create entry');
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // Check if user can edit entry (owner or admin)
  const canEditEntry = (entry) => {
    return entry.user_id === user.id || user.role === 'admin';
  };

  return (
    <div className="space-y-6" data-testid="time-tracker-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('timeTracker.title')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mt-2">
            Track your daily work hours
          </p>
        </div>
        <Button onClick={() => setShowManualDialog(true)} data-testid="add-manual-entry-btn">
          <Plus className="h-4 w-4 mr-2" />
          {t('timeEntry.addManual')}
        </Button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          data-testid="date-selector"
          className="w-48"
        />
        <div className="text-sm text-muted-foreground">
          {t('timeEntry.total')}: <span className="font-semibold text-foreground">{formatDuration(totalSeconds)}</span>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left" data-testid="time-entries-table">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="p-4 align-middle">{t('timeEntry.time')}</th>
                <th className="p-4 align-middle">{t('timeEntry.project')}</th>
                <th className="p-4 align-middle">{t('timeEntry.task')}</th>
                <th className="p-4 align-middle">{t('timeTracker.duration')}</th>
                <th className="p-4 align-middle">{t('timeEntry.type')}</th>
                <th className="p-4 align-middle">{t('timeEntry.notes')}</th>
                <th className="p-4 align-middle">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted-foreground">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted-foreground">
                    {t('timeEntry.noEntries')}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const project = projects.find(p => p.id === entry.project_id);
                  const task = allTasks.find(t => t.id === entry.task_id);
                  
                  return (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4 align-middle">
                        {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 align-middle">{project?.name || 'No Project'}</td>
                      <td className="p-4 align-middle">{task?.name || 'No Task'}</td>
                      <td className="p-4 align-middle font-medium">{formatDuration(entry.duration)}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          entry.entry_type === 'timer' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.entry_type}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{entry.notes || '-'}</td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2">
                          {canEditEntry(entry) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              data-testid={`edit-entry-${entry.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            data-testid={`delete-entry-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent data-testid="manual-entry-dialog">
          <DialogHeader>
            <DialogTitle>{t('timeEntry.addManual')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.project')} <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Select
                value={manualForm.project_id}
                onValueChange={(value) => {
                  setManualForm({ ...manualForm, project_id: value, task_id: '' });
                  if (value && value !== 'none') {
                    fetchTasks(value);
                  } else {
                    setTasks([]);
                  }
                }}
              >
                <SelectTrigger data-testid="manual-project-select">
                  <SelectValue placeholder={t('timeTracker.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.task')} <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Select
                value={manualForm.task_id}
                onValueChange={(value) => setManualForm({ ...manualForm, task_id: value })}
                disabled={!manualForm.project_id || manualForm.project_id === 'none'}
              >
                <SelectTrigger data-testid="manual-task-select">
                  <SelectValue placeholder={t('timeTracker.selectTask')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Task</SelectItem>
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
                  value={manualForm.start_time}
                  onChange={(e) => setManualForm({ ...manualForm, start_time: e.target.value })}
                  required
                  data-testid="manual-start-time"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('timeEntry.endTime')}</label>
                <Input
                  type="datetime-local"
                  value={manualForm.end_time}
                  onChange={(e) => setManualForm({ ...manualForm, end_time: e.target.value })}
                  required
                  data-testid="manual-end-time"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.notesOptional')}</label>
              <Input
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder={t('timeTracker.addNotes')}
                data-testid="manual-notes"
              />
            </div>

            <Button type="submit" className="w-full" data-testid="manual-entry-submit">
              {t('common.add')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="edit-entry-dialog">
          <DialogHeader>
            <DialogTitle>{t('timeEntry.edit')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.project')} <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Select
                value={editForm.project_id}
                onValueChange={(value) => {
                  setEditForm({ ...editForm, project_id: value, task_id: '' });
                  if (value && value !== 'none') {
                    fetchTasks(value);
                  } else {
                    setTasks([]);
                  }
                }}
              >
                <SelectTrigger data-testid="edit-project-select">
                  <SelectValue placeholder={t('timeTracker.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('timeEntry.task')} <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Select
                value={editForm.task_id}
                onValueChange={(value) => setEditForm({ ...editForm, task_id: value })}
                disabled={!editForm.project_id || editForm.project_id === 'none'}
              >
                <SelectTrigger data-testid="edit-task-select">
                  <SelectValue placeholder={t('timeTracker.selectTask')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Task</SelectItem>
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
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t('timeTracker.addNotes')}
                data-testid="edit-notes"
              />
            </div>

            <Button type="submit" className="w-full" data-testid="edit-entry-submit">
              {t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
