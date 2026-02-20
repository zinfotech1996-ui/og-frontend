import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { User, Mail, Shield, Lock, Info } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SettingsPage = () => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Time Tracking Settings State
  const [timeTrackingSettings, setTimeTrackingSettings] = useState({
    first_day_of_week: 'monday',
    working_on_weekends: false
  });
  const [timeTrackingLoading, setTimeTrackingLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch time tracking settings on mount
  useEffect(() => {
    fetchTimeTrackingSettings();
  }, []);

  const fetchTimeTrackingSettings = async () => {
    try {
      const response = await axios.get(`${API}/user/time-tracking-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeTrackingSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch time tracking settings:', error);
      // Use default values if fetch fails
    } finally {
      setLoadingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.put(`${API}/auth/change-password`, {
        new_password: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(t('settings.passwordChanged'));
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTimeTrackingUpdate = async () => {
    setTimeTrackingLoading(true);
    try {
      await axios.put(`${API}/user/time-tracking-settings`, timeTrackingSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Time tracking settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update time tracking settings');
    } finally {
      setTimeTrackingLoading(false);
    }
  };

  const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'saturday', label: 'Saturday' }
  ];

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('settings.title')}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('settings.profile')}
        </h2>
        <div className="space-y-4 max-w-2xl">
          <div>
            <Label htmlFor="name">{t('settings.name')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <Input id="name" value={user?.name || ''} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="email">{t('settings.email')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Input id="email" value={user?.email || ''} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="role">{t('settings.role')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <Input id="role" value={user?.role || ''} disabled className="capitalize" />
            </div>
          </div>
        </div>
      </div>

      {/* Security - Change Password */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('settings.security')}
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
          <div>
            <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                data-testid="new-password-input"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                data-testid="confirm-password-input"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={passwordLoading}
            data-testid="change-password-submit"
          >
            {passwordLoading ? t('common.loading') : t('settings.updatePassword')}
          </Button>
        </form>
      </div>

      {/* Time Tracking Section - NEW */}
      {/* <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Time tracking
        </h2>       
        {loadingSettings ? (
          <div className="text-muted-foreground">Loading settings...</div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            <div>
              <Label htmlFor="firstDayOfWeek" className="text-base mb-3 block">
                First day of the week
              </Label>
              <Select
                value={timeTrackingSettings.first_day_of_week}
                onValueChange={(value) => setTimeTrackingSettings({ ...timeTrackingSettings, first_day_of_week: value })}
              >
                <SelectTrigger 
                  id="firstDayOfWeek" 
                  className="w-full"
                  data-testid="first-day-of-week-select"
                >
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="workingOnWeekends"
                checked={timeTrackingSettings.working_on_weekends}
                onCheckedChange={(checked) => setTimeTrackingSettings({ ...timeTrackingSettings, working_on_weekends: checked })}
                data-testid="working-on-weekends-checkbox"
              />
              <Label 
                htmlFor="workingOnWeekends" 
                className="text-base font-normal cursor-pointer flex items-center gap-2"
              >
                Working on weekends
                <Info 
                  className="h-4 w-4 text-muted-foreground cursor-help" 
                  title="Enable this if you work on weekends and want to track time during those days"
                />
              </Label>
            </div>
            <Button 
              onClick={handleTimeTrackingUpdate}
              disabled={timeTrackingLoading}
              data-testid="save-time-tracking-settings"
            >
              {timeTrackingLoading ? 'Saving...' : 'Save Time Tracking Settings'}
            </Button>
          </div>
        )}
      </div> */}

      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('settings.appearance')}
        </h2>
        <div className="flex items-center justify-between max-w-2xl">
          <div>
            <div className="font-medium">{t('settings.theme')}</div>
            <div className="text-sm text-muted-foreground">
              {t('settings.currentTheme')}: {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
            </div>
          </div>
          <Button onClick={toggleTheme} data-testid="theme-toggle-settings">
            {t('settings.switchTo')} {theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
          </Button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('settings.language')}
        </h2>
        <div className="flex items-center justify-between max-w-2xl">
          <div>
            <div className="font-medium">{t('settings.displayLanguage')}</div>
            <div className="text-sm text-muted-foreground">
              {t('settings.currentLanguage')}: {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Español' : i18n.language === 'fr' ? 'Français' : i18n.language === 'de' ? 'Deutsch' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
