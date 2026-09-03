import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Layers, DoorOpen, Bed,
  Users, CreditCard, FileText, MessageSquare, Wrench,
  Megaphone, Star, FolderOpen, BarChart3, TrendingUp,
  UserCog, Bell, Settings, ClipboardList, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Search,
  Moon, Sun, Home
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '@/services/notificationService'
import { subscribeToNotifications } from '@/services/notificationService'
import toast from 'react-hot-toast'
import logoImage from '@/assets/AR PG Logo.png'

const NAV_GROUPS = [
// ... (keeping existing nav groups)

  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Property',
    items: [
      { to: '/admin/properties', label: 'Properties', icon: Building2 },
      { to: '/admin/buildings', label: 'Buildings', icon: Layers },
      { to: '/admin/floors', label: 'Floors', icon: Layers },
      { to: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
      { to: '/admin/beds', label: 'Beds', icon: Bed },
    ],
  },
  {
    label: 'Tenants',
    items: [
      { to: '/admin/tenants', label: 'Tenants', icon: Users },
      { to: '/admin/enquiries', label: 'Enquiries', icon: HelpCircle },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/invoices', label: 'Invoices', icon: FileText },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/amenities', label: 'Amenities', icon: Star },
      { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin/staff', label: 'Staff', icon: UserCog },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)

  // Unread notification count
  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: ['unread-notifications', profile?.user_id],
    queryFn: () => getUnreadCount(profile!.user_id),
    enabled: !!profile?.user_id,
    refetchInterval: 30_000,
  })

  // Realtime notifications
  useEffect(() => {
    if (!profile?.user_id) return
    const { unsubscribe } = subscribeToNotifications(profile.user_id, (notification) => {
      toast(notification.title, { icon: '🔔' })
      refetchUnread()
    })
    return () => { unsubscribe() }
  }, [profile?.user_id, refetchUnread])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm font-display text-foreground truncate">Atharv Reddy PG</p>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1.5 px-3">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={(item as any).end}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={`px-3 py-4 border-t border-border space-y-1`}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setDark(!dark)}
          className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={`sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 translate-x-[calc(100%-1px)] -translate-y-1/2 z-10 w-6 h-12 bg-card border border-border rounded-r-xl flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
          style={{ left: collapsed ? '72px' : '256px' }}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <Search className="w-4 h-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tenants, rooms, invoices…"
              className="bg-transparent flex-1 outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="relative p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <span className="hidden sm:block text-sm font-medium">{profile?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* iOS Style Mobile Bottom Navigation (Floating Pill) */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex justify-around items-center h-[72px] px-2 relative">
          
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 gap-1.5 ${
                isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'}`} />
                <span className="text-[10px] font-semibold tracking-wide">Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/tenants"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 gap-1.5 ${
                isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Users className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'}`} />
                <span className="text-[10px] font-semibold tracking-wide">Tenants</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/invoices"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 gap-1.5 relative z-10 ${
                isActive ? 'text-[#c69a47]' : 'text-[#d4b26a]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Floating Gold Circle */}
                <div className={`absolute -top-7 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isActive ? 'bg-[#b68c3e] shadow-[#d4b26a]/40 scale-105' : 'bg-[#d4b26a] shadow-[#d4b26a]/30'
                }`}>
                  <FileText className="w-7 h-7 text-white stroke-[2.5px]" />
                </div>
                <div className="h-7"></div> {/* Spacer */}
                <span className="text-[11px] font-bold tracking-wide mt-1">Invoice</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/documents"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 gap-1.5 ${
                isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FolderOpen className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'}`} />
                <span className="text-[10px] font-semibold tracking-wide">Documents</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 gap-1.5 ${
                isActive ? 'text-gray-800' : 'text-gray-400 hover:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <UserCog className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'}`} />
                <span className="text-[10px] font-semibold tracking-wide">Profile</span>
              </>
            )}
          </NavLink>
        </div>
      </div>
    </div>
  )
}
