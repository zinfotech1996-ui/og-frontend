import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const TimerContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TimerProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Load active timer on mount
  useEffect(() => {
    if (user && token) {
      checkActiveTimer();
    }
  }, [user, token]);

  // Timer tick
  useEffect(() => {
    let interval;
    if (isRunning && activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.start_time).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer]);

  // Heartbeat every 30 seconds
  useEffect(() => {
    let heartbeat;
    if (isRunning && token) {
      heartbeat = setInterval(async () => {
        try {
          await axios.post(`${API}/timer/heartbeat`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }, 30000);
    }
    return () => clearInterval(heartbeat);
  }, [isRunning, token]);

  const checkActiveTimer = async () => {
    try {
      const response = await axios.get(`${API}/timer/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.active) {
        setActiveTimer(response.data.timer);
        setIsRunning(true);
        const start = new Date(response.data.timer.start_time).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }
    } catch (error) {
      console.error('Failed to check active timer:', error);
    }
  };

  const startTimer = async (projectId, taskId) => {
    try {
      const response = await axios.post(
        `${API}/timer/start`,
        { project_id: projectId, task_id: taskId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveTimer(response.data.timer);
      setIsRunning(true);
      setElapsed(0);
      toast.success('Timer started');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start timer');
      return { success: false };
    }
  };

  const stopTimer = async (notes = '') => {
    try {
      await axios.post(
        `${API}/timer/stop`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveTimer(null);
      setIsRunning(false);
      setElapsed(0);
      toast.success('Timer stopped');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to stop timer');
      return { success: false };
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        elapsed,
        isRunning,
        startTimer,
        stopTimer,
        formatTime,
        refreshTimer: checkActiveTimer
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};
