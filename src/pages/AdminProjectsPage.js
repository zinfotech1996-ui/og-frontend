import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, FolderKanban, ListChecks } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminProjectsPage = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  
  const [projectForm, setProjectForm] = useState({ id: '', name: '', description: '' });
  const [taskForm, setTaskForm] = useState({ id: '', name: '', description: '', project_id: '' });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
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

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingProject) {
        await axios.put(`${API}/projects/${projectForm.id}`, projectForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminProjects.messages.projectUpdated'));
      } else {
        await axios.post(`${API}/projects`, projectForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminProjects.messages.projectCreated'));
      }
      setShowProjectDialog(false);
      resetProjectForm();
      fetchProjects();
    } catch (error) {
      toast.error(t('adminProjects.messages.operationFailed'));
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingTask) {
        await axios.put(`${API}/tasks/${taskForm.id}`, taskForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminProjects.messages.taskUpdated'));
      } else {
        await axios.post(`${API}/tasks`, taskForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminProjects.messages.taskCreated'));
      }
      setShowTaskDialog(false);
      resetTaskForm();
      fetchTasks();
    } catch (error) {
      toast.error(t('adminProjects.messages.operationFailed'));
    }
  };

  const resetProjectForm = () => {
    setProjectForm({ id: '', name: '', description: '' });
    setIsEditingProject(false);
  };

  const resetTaskForm = () => {
    setTaskForm({ id: '', name: '', description: '', project_id: '' });
    setIsEditingTask(false);
  };

  const openCreateProject = () => {
    resetProjectForm();
    setShowProjectDialog(true);
  };

  const openEditProject = (project) => {
    setProjectForm(project);
    setIsEditingProject(true);
    setShowProjectDialog(true);
  };

  const openCreateTask = () => {
    resetTaskForm();
    setShowTaskDialog(true);
  };

  const openEditTask = (task) => {
    setTaskForm(task);
    setIsEditingTask(true);
    setShowTaskDialog(true);
  };

  return (
    <div className="space-y-6" data-testid="admin-projects-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('adminProjects.title')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {t('adminProjects.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects" data-testid="projects-tab">
            <FolderKanban className="h-4 w-4 mr-2" />
            {t('adminProjects.tabs.projects')}
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tasks-tab">
            <ListChecks className="h-4 w-4 mr-2" />
            {t('adminProjects.tabs.tasks')}
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateProject} data-testid="create-project-btn">
              <Plus className="h-4 w-4 mr-2" />
              {t('adminProjects.addProject')}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" data-testid="projects-table">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4 align-middle">{t('adminProjects.projectsTable.name')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.projectsTable.description')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.projectsTable.status')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.projectsTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-muted-foreground">
                        {t('adminProjects.messages.noProjects')}
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4 align-middle font-medium">{project.name}</td>
                        <td className="p-4 align-middle text-muted-foreground">{project.description || '-'}</td>
                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                            {project.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditProject(project)}
                            data-testid={`edit-project-${project.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateTask} data-testid="create-task-btn">
              <Plus className="h-4 w-4 mr-2" />
              {t('adminProjects.addTask')}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" data-testid="tasks-table">
                <thead className="bg-muted/50 text-muted-foreground font-medium">
                  <tr>
                    <th className="p-4 align-middle">{t('adminProjects.tasksTable.name')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.tasksTable.project')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.tasksTable.description')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.tasksTable.status')}</th>
                    <th className="p-4 align-middle">{t('adminProjects.tasksTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">
                        {t('adminProjects.messages.noTasks')}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const project = projects.find(p => p.id === task.project_id);
                      return (
                        <tr key={task.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="p-4 align-middle font-medium">{task.name}</td>
                          <td className="p-4 align-middle">{project?.name || t('adminProjects.messages.unknownProject')}</td>
                          <td className="p-4 align-middle text-muted-foreground">{task.description || '-'}</td>
                          <td className="p-4 align-middle">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              {task.status}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditTask(task)}
                              data-testid={`edit-task-${task.id}`}
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
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent data-testid="project-dialog">
          <DialogHeader>
            <DialogTitle>{isEditingProject ? t('adminProjects.projectDialog.editTitle') : t('adminProjects.projectDialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminProjects.projectDialog.name')}</label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
                data-testid="project-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminProjects.projectDialog.description')}</label>
              <Textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                rows={3}
                data-testid="project-description-input"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="project-submit-btn">
              {isEditingProject ? t('adminProjects.projectDialog.updateButton') : t('adminProjects.projectDialog.createButton')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent data-testid="task-dialog">
          <DialogHeader>
            <DialogTitle>{isEditingTask ? t('adminProjects.taskDialog.editTitle') : t('adminProjects.taskDialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminProjects.taskDialog.name')}</label>
              <Input
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                required
                data-testid="task-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminProjects.taskDialog.project')}</label>
              <select
                value={taskForm.project_id}
                onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-input rounded-md"
                data-testid="task-project-select"
              >
                <option value="">{t('adminProjects.taskDialog.selectProject')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminProjects.taskDialog.description')}</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3}
                data-testid="task-description-input"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="task-submit-btn">
              {isEditingTask ? t('adminProjects.taskDialog.updateButton') : t('adminProjects.taskDialog.createButton')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
