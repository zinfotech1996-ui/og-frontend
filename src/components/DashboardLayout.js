import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, LayoutDashboard, Users, FolderKanban, FileText, BarChart3, Settings, LogOut, Moon, Sun, Globe, Bell, Menu, X, ClipboardCheck, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from './ui/button';
import { StickyTimerWidget } from './StickyTimerWidget';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { NotificationDropdown } from './NotificationDropdown';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread messages count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {

        let total = 0;
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const API = `${BACKEND_URL}/api`;

        if (user.role === 'admin') {
          const res = await import('axios').then(axios => axios.default.get(`${API}/messages/conversations`, {
            headers: { Authorization: `Bearer ${user.token || localStorage.getItem('token')}` }
          }));
          total = res.data.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
        } else {
          // Employee: check unread from admin
          // First get admin ID
          const adminRes = await import('axios').then(axios => axios.default.get(`${API}/messages/admin`, {
            headers: { Authorization: `Bearer ${user.token || localStorage.getItem('token')}` }
          }));
          const admin = adminRes.data;
          if (admin) {

            const msgsRes = await import('axios').then(axios => axios.default.get(`${API}/messages/${admin.id}`, {
              headers: { Authorization: `Bearer ${user.token || localStorage.getItem('token')}` }
            }));

            const unread = msgsRes.data.filter(m => m.receiver_id === user.id && !m.is_read).length;
            total = unread;
          }
        }
        setUnreadCount(total);
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
  };

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇬🇧' },
    { code: 'es', name: t('language.spanish'), flag: '🇪🇸' },
    { code: 'fr', name: t('language.french'), flag: '🇫🇷' },
    { code: 'de', name: t('language.german'), flag: '🇩🇪' },
  ];

  const isAdmin = user.role === 'admin';

  const navigation = isAdmin
    ? [
      // { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
      { name: t('Tracker'), href: '/tracker', icon: Clock },
      { name: t('Detailed view'), href: '/detailed-view', icon: FileText },
      { name: t('nav.approvals'), href: '/admin/approvals', icon: ClipboardCheck },
      { name: t('nav.projectsTasks'), href: '/admin/projects', icon: FolderKanban },
      { name: t('Report Timesheet'), href: '/report-timesheet', icon: BarChart3 },
      { name: t('Users'), href: '/admin/team', icon: Users },
      { name: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadCount },
      { name: t('nav.settings'), href: '/settings', icon: Settings },
    ]
    : [
      // { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
      { name: t('Tracker'), href: '/tracker', icon: Clock },
      { name: t('Detailed view'), href: '/detailed-view', icon: FileText },
      { name: t('Approvals'), href: '/timesheets', icon: ClipboardCheck },
      { name: t('Report Timesheet'), href: '/report-timesheet', icon: BarChart3 },
      { name: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadCount },
      { name: t('nav.settings'), href: '/settings', icon: Settings },
    ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {t('app.title')}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-300 ease-in-out 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className={`p-4 border-b border-border mt-16 lg:mt-0 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen ? (
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {t('app.title')}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{t('app.subtitle')}</p>
              </div>
            ) : (
              <img src="/omni_gratum_logo.png" alt="Logo" className="h-10 w-auto" />
            )}

            {/* Desktop Sidebar Toggle (Close/Open) inside sidebar to keep it accessible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`hidden lg:flex ${isSidebarOpen ? '' : 'absolute -right-3 top-6 bg-card border shadow-sm h-6 w-6 rounded-full z-50'}`}
              title={isSidebarOpen ? t('common.closeSidebar') : t('common.openSidebar')}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-3 w-3" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                    }`}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
                  {item.badge > 0 && (
                    <span className={`${isSidebarOpen ? 'ml-auto' : 'absolute top-1 right-1'} flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border space-y-2">
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2`}>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              )}
            </div>

            <div className={`flex ${isSidebarOpen ? 'gap-2' : 'flex-col gap-2'}`}>
              {isSidebarOpen ? (
                <>
                  <NotificationDropdown />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {languages.map((lang) => (
                        <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                          <span className="mr-2">{lang.flag}</span>{lang.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="flex-1">
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout} className="flex-1">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                // Collapsed mode actions
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="ghost" size="sm" onClick={logout} title="Logout">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`min-h-screen pt-20 lg:pt-0 transition-[margin] duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>

      {/* Sticky Timer Widget for employees */}
      {!isAdmin && <StickyTimerWidget />}
    </div>
  );
};
