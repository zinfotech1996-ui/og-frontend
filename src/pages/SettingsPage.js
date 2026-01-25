import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Mail, Shield, Lock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SettingsPage = () => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(t('settings.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

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
            <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                data-testid="current-password-input"
              />
            </div>
          </div>
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
              {t('settings.currentTheme')}: {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Español' : i18n.language === 'fr' ? 'Français' : 'Deutsch'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
