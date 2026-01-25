import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ReportsPage = () => {
  const { token, user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    group_by: 'date',
    user_id: '',
    project_id: ''
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
    fetchProjects();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.filter(u => u.role === 'employee'));
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

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        group_by: filters.group_by,
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.project_id && { project_id: filters.project_id })
      });

      const response = await axios.get(`${API}/reports/time?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        ...(filters.user_id && { user_id: filters.user_id })
      });

      const response = await axios.get(`${API}/reports/export/pdf?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `time_report_${filters.start_date}_${filters.end_date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        ...(filters.user_id && { user_id: filters.user_id })
      });

      const response = await axios.get(`${API}/reports/export/csv?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `time_report_${filters.start_date}_${filters.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Reports
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          Generate and export time tracking reports
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              data-testid="filter-start-date"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              data-testid="filter-end-date"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Group By</label>
            <Select value={filters.group_by} onValueChange={(value) => setFilters({ ...filters, group_by: value })}>
              <SelectTrigger data-testid="filter-group-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Employee</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <Select value={filters.user_id || 'all'} onValueChange={(value) => setFilters({ ...filters, user_id: value === 'all' ? '' : value })}>
                <SelectTrigger data-testid="filter-user">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={generateReport} disabled={loading} data-testid="generate-report-btn">
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          {reportData && (
            <>
              <Button variant="outline" onClick={exportPDF} data-testid="export-pdf-btn">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Report Results
              </h2>
              <div className="text-right">
                <div className="text-2xl font-bold">{reportData.summary.total_hours}h</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" data-testid="report-results-table">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="p-4 align-middle">Label</th>
                  <th className="p-4 align-middle">Total Hours</th>
                  <th className="p-4 align-middle">Entry Count</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-middle font-medium">{item.label}</td>
                    <td className="p-4 align-middle">{item.total_hours}h</td>
                    <td className="p-4 align-middle text-muted-foreground">{item.entry_count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 font-semibold">
                <tr>
                  <td className="p-4 align-middle">Total</td>
                  <td className="p-4 align-middle">{reportData.summary.total_hours}h</td>
                  <td className="p-4 align-middle">{reportData.summary.total_entries}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
