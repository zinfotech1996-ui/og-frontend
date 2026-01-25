import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { FileText, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TimesheetsPage = () => {
  const { token } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState({ start: '', end: '' });

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
  }, []);

  useEffect(() => {
    if (selectedWeek.start && selectedWeek.end) {
      fetchWeekEntries();
    }
  }, [selectedWeek]);

  const fetchTimesheets = async () => {
    try {
      const response = await axios.get(`${API}/timesheets`, {
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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit timesheet');
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

      {/* Current Week Summary */}
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

        <div className="flex items-center gap-4">
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
      </div>

      {/* Timesheets History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Submission History
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
                    No timesheets yet
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
