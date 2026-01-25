import React, { useState, useEffect } from 'react';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const StickyTimerWidget = () => {
  const { activeTimer, elapsed, isRunning, startTimer, stopTimer, formatTime } = useTimer();
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
      // Reset task selection when project changes
      setSelectedTask('');
    } else {
      setTasks([]);
      setSelectedTask('');
    }
  }, [selectedProject]);

  useEffect(() => {
    // Only set defaults if user has them configured
    if (user?.default_project && projects.length > 0) {
      const projectExists = projects.find(p => p.id === user.default_project);
      if (projectExists) {
        setSelectedProject(user.default_project);
      }
    }
    if (user?.default_task && tasks.length > 0) {
      const taskExists = tasks.find(t => t.id === user.default_task);
      if (taskExists) {
        setSelectedTask(user.default_task);
      }
    }
  }, [user, projects, tasks]);

  // Load active timer project and task info on mount
  useEffect(() => {
    if (activeTimer?.project_id && activeTimer?.task_id) {
      loadActiveTimerInfo();
    }
  }, [activeTimer]);

  const loadActiveTimerInfo = async () => {
    if (!activeTimer) return;
    
    try {
      // Fetch all projects if not loaded
      if (projects.length === 0) {
        await fetchProjects();
      }
      
      // Fetch tasks for active timer's project
      if (activeTimer.project_id) {
        await fetchTasks(activeTimer.project_id);
      }
    } catch (error) {
      console.error('Failed to load active timer info:', error);
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

  const handleStart = async () => {
    // Allow starting timer even without project/task selection
    const result = await startTimer(selectedProject || null, selectedTask || null);
    if (result.success) {
      setShowDialog(false);
    }
  };

  const handleStop = async () => {
    await stopTimer();
  };

  if (!isRunning) {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <button
            data-testid="floating-timer-start-btn"
            className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110"
          >
            <Play className="h-6 w-6" />
          </button>
        </DialogTrigger>
        <DialogContent data-testid="start-timer-dialog">
          <DialogHeader>
            <DialogTitle>Start Timer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="project-select">
                  <SelectValue placeholder="Select project" />
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
              <label className="text-sm font-medium mb-2 block">Task</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger data-testid="task-select">
                  <SelectValue placeholder="Select task" />
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
            <Button
              onClick={handleStart}
              data-testid="start-timer-submit-btn"
              className="w-full"
            >
              Start Timer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isRunning) {
    const currentProject = projects.find(p => p.id === activeTimer?.project_id);
    const currentTask = tasks.find(t => t.id === activeTimer?.task_id);
    
    return (
      <div
        data-testid="active-timer-widget"
        className="fixed bottom-6 right-6 z-50 bg-card border border-border shadow-xl rounded-xl p-4 backdrop-blur-md min-w-[280px]"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" data-testid="timer-running-indicator"></div>
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">RUNNING</span>
        </div>
        
        <div className="mb-3">
          <div
            data-testid="timer-display"
            className="text-3xl font-mono font-bold tabular-nums tracking-wider"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatTime(elapsed)}
          </div>
        </div>
        
        <div className="mb-3 space-y-1">
          <div className="text-xs text-muted-foreground">Project</div>
          <div className="text-sm font-medium truncate">{currentProject?.name || 'Loading...'}</div>
          <div className="text-xs text-muted-foreground mt-2">Task</div>
          <div className="text-sm font-medium truncate">{currentTask?.name || 'Loading...'}</div>
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStop}
          data-testid="timer-stop-btn"
          className="w-full"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Timer
        </Button>
      </div>
    );
  }

  return null;
};
