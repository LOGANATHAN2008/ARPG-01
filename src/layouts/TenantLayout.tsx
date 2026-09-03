import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, DoorOpen, CreditCard, MessageSquare, Bell, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '@/services/notificationService'
import logoImage from '@/assets/AR PG Logo.png'

const BOTTOM_NAV = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/room', label: 'Room', icon: DoorOpen },
  { to: '/portal/payments', label: 'Payments', icon: CreditCard },
  { to: '/portal/complaints', label: 'Issues', icon: MessageSquare },
  { to: '/portal/notices', label: 'Notices', icon: Bell },
  { to: '/portal/profile', label: 'Profile', icon: User },
]

export default function TenantLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', profile?.user_id],
    queryFn: () => getUnreadCount(profile!.user_id),
    enabled: !!profile?.user_id,
    refetchInterval: 30_000,
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top header (mobile) */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between safe-pt">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold font-display text-foreground">Atharv Reddy PG</p>
            <p className="text-xs text-muted-foreground">{profile?.full_name}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/portal/notices')}
          className="relative p-2 rounded-xl hover:bg-accent"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={(item as any).end}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'mobile-nav-item-active text-primary' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
