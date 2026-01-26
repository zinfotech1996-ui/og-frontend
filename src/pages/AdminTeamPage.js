import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, UserCheck, UserX } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminTeamPage = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    status: 'active',
    default_project: '',
    default_task: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`${API}/admin/employees/${formData.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminTeam.messages.employeeUpdated'));
      } else {
        await axios.post(`${API}/admin/employees`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(t('adminTeam.messages.employeeCreated'));
      }
      setShowDialog(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('adminTeam.messages.operationFailed'));
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      password: '',
      status: employee.status,
      default_project: employee.default_project || '',
      default_task: employee.default_task || ''
    });
    setIsEditing(true);
    setShowDialog(true);
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${API}/admin/employees/${employeeId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t(newStatus === 'active' ? 'adminTeam.messages.employeeActivated' : 'adminTeam.messages.employeeDeactivated'));
      fetchEmployees();
    } catch (error) {
      toast.error(t('adminTeam.messages.statusUpdateFailed'));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      email: '',
      password: '',
      status: 'active',
      default_project: '',
      default_task: ''
    });
    setIsEditing(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  return (
    <div className="space-y-6" data-testid="admin-team-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {t('adminTeam.title')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mt-2">
            {t('adminTeam.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-employee-btn">
          <Plus className="h-4 w-4 mr-2" />
          {t('adminTeam.addEmployee')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-3xl font-bold">{employees.filter(e => e.role === 'employee').length}</div>
          <div className="text-sm text-muted-foreground mt-1">{t('adminTeam.totalEmployees')}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-3xl font-bold">{employees.filter(e => e.status === 'active' && e.role === 'employee').length}</div>
          <div className="text-sm text-muted-foreground mt-1">{t('adminTeam.activeEmployees')}</div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left" data-testid="employees-table">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="p-4 align-middle">{t('adminTeam.table.name')}</th>
                <th className="p-4 align-middle">{t('adminTeam.table.email')}</th>
                <th className="p-4 align-middle">{t('adminTeam.table.role')}</th>
                <th className="p-4 align-middle">{t('adminTeam.table.status')}</th>
                <th className="p-4 align-middle">{t('adminTeam.table.defaultProject')}</th>
                <th className="p-4 align-middle">{t('adminTeam.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">
                    {t('adminTeam.messages.loading')}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground">
                    {t('adminTeam.messages.noEmployees')}
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 align-middle font-medium">{employee.name}</td>
                    <td className="p-4 align-middle">{employee.email}</td>
                    <td className="p-4 align-middle capitalize">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        employee.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t(`adminTeam.roles.${employee.role}`)}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`adminTeam.status.${employee.status}`)}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {projects.find(p => p.id === employee.default_project)?.name || '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(employee)}
                          data-testid={`edit-employee-${employee.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {employee.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(employee.id, employee.status)}
                            data-testid={`toggle-status-${employee.id}`}
                          >
                            {employee.status === 'active' ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="employee-dialog">
          <DialogHeader>
            <DialogTitle>{isEditing ? t('adminTeam.dialog.editTitle') : t('adminTeam.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminTeam.dialog.name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="employee-name-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminTeam.dialog.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="employee-email-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('adminTeam.dialog.password')} {isEditing && t('adminTeam.dialog.passwordHint')}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEditing}
                data-testid="employee-password-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminTeam.dialog.status')}</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="employee-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('adminTeam.status.activeLabel')}</SelectItem>
                  <SelectItem value="inactive">{t('adminTeam.status.inactiveLabel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('adminTeam.dialog.defaultProject')}</label>
              <Select
                value={formData.default_project}
                onValueChange={(value) => setFormData({ ...formData, default_project: value })}
              >
                <SelectTrigger data-testid="employee-project-select">
                  <SelectValue placeholder={t('adminTeam.dialog.selectProject')} />
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
              <label className="text-sm font-medium mb-2 block">{t('adminTeam.dialog.defaultTask')}</label>
              <Select
                value={formData.default_task}
                onValueChange={(value) => setFormData({ ...formData, default_task: value })}
              >
                <SelectTrigger data-testid="employee-task-select">
                  <SelectValue placeholder={t('adminTeam.dialog.selectTask')} />
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

            <Button type="submit" className="w-full" data-testid="employee-submit-btn">
              {isEditing ? t('adminTeam.dialog.updateButton') : t('adminTeam.dialog.createButton')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
