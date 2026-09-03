import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, MessageSquare, Bell, DoorOpen, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Wifi, Shield, Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getTenantByUserId, getTenantPaymentSummary } from '@/services/tenantService'
import { getComplaints } from '@/services/complaintService'
import { getNotifications } from '@/services/notificationService'
import { formatCurrency, formatDate, formatDateTime, getInvoiceStatusColor, titleCase } from '@/utils'

function QuickAction({ icon: Icon, label, to, color }: {
  icon: React.ElementType; label: string; to: string; color: string
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className='flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:shadow-card hover:border-primary/20 transition-all group'
    >
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon className='w-5 h-5' />
      </div>
      <span className='text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight'>{label}</span>
    </button>
  )
}

export default function TenantDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant', profile?.user_id],
    queryFn: () => getTenantByUserId(profile!.user_id),
    enabled: !!profile?.user_id,
  })

  const { data: paymentSummary } = useQuery({
    queryKey: ['my-payment-summary', tenant?.id],
    queryFn: () => getTenantPaymentSummary(tenant!.id),
    enabled: !!tenant?.id,
  })

  const { data: complaints = [] } = useQuery({
    queryKey: ['my-complaints', tenant?.id],
    queryFn: () => getComplaints({ tenant_id: tenant!.id }),
    enabled: !!tenant?.id,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['my-notifications', profile?.user_id],
    queryFn: () => getNotifications(profile!.user_id, 5),
    enabled: !!profile?.user_id,
  })

  const openComplaints = complaints.filter((c) =>
    ['submitted', 'acknowledged', 'assigned', 'in_progress'].includes(c.status)
  )
  const unreadNotifications = notifications.filter((n) => !n.is_read)

  return (
    <div className='space-y-5'>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white relative overflow-hidden'
      >
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-8 -translate-y-8' />
          <div className='absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-4 translate-y-4' />
        </div>
        <div className='relative z-10'>
          <p className='text-white/70 text-sm mb-1'>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
          </p>
          <h1 className='text-2xl font-bold font-display mb-0.5'>{profile?.full_name?.split(' ')[0]}</h1>
          {tenant && (
            <p className='text-white/70 text-sm'>
              Room {(tenant.room as any)?.room_number} · Bed {(tenant.bed as any)?.bed_label} ·{' '}
              {(tenant.room as any)?.floor?.name}
            </p>
          )}
        </div>
      </motion.div>

      {/* Pending payment alert */}
      {paymentSummary && paymentSummary.totalPending > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className='flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors'
          onClick={() => navigate('/portal/payments')}
        >
          <div className='p-2 bg-amber-100 rounded-xl flex-shrink-0'>
            <AlertTriangle className='w-5 h-5 text-amber-600' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-amber-800 text-sm'>Payment Pending</p>
            <p className='text-amber-700 text-xs'>
              {formatCurrency(paymentSummary.totalPending)} due — tap to pay now
            </p>
          </div>
          <ArrowRight className='w-4 h-4 text-amber-600 flex-shrink-0' />
        </motion.div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className='font-semibold text-foreground mb-3 text-sm'>Quick Actions</h2>
        <div className='grid grid-cols-4 gap-3'>
          <QuickAction icon={CreditCard} label='Pay Rent' to='/portal/payments/pay' color='bg-blue-50 text-blue-600' />
          <QuickAction icon={MessageSquare} label='Raise Issue' to='/portal/complaints/new' color='bg-orange-50 text-orange-600' />
          <QuickAction icon={DoorOpen} label='My Room' to='/portal/room' color='bg-purple-50 text-purple-600' />
          <QuickAction icon={Bell} label='Notices' to='/portal/notices' color='bg-green-50 text-green-600' />
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-3'>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className='pg-card p-4'
        >
          <div className='flex items-center gap-2 mb-2'>
            <div className='p-1.5 bg-amber-50 rounded-lg'><AlertTriangle className='w-4 h-4 text-amber-600'/></div>
            <span className='text-sm text-muted-foreground'>Outstanding</span>
          </div>
          <p className='text-xl font-bold text-foreground'>{formatCurrency(paymentSummary?.totalPending || 0)}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>
            {paymentSummary?.invoices?.filter(i => ['pending','partially_paid','overdue'].includes(i.status)).length || 0} invoice{paymentSummary?.invoices?.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='pg-card p-4'
        >
          <div className='flex items-center gap-2 mb-2'>
            <div className='p-1.5 bg-orange-50 rounded-lg'><MessageSquare className='w-4 h-4 text-orange-500'/></div>
            <span className='text-sm text-muted-foreground'>Open Issues</span>
          </div>
          <p className='text-xl font-bold text-foreground'>{openComplaints.length}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>
            {openComplaints.length === 0 ? 'All clear! 🎉' : 'Being worked on'}
          </p>
        </motion.div>
      </div>

      {/* Room amenities */}
      {tenant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className='pg-card p-4'
        >
          <h3 className='font-semibold text-foreground mb-3 text-sm'>Your Room Info</h3>
          <div className='grid grid-cols-3 gap-3'>
            {[
              { icon: Wifi, label: 'Wi-Fi', status: 'Active', color: 'text-blue-600 bg-blue-50' },
              { icon: Shield, label: 'Security', status: '24/7', color: 'text-green-600 bg-green-50' },
              { icon: Zap, label: 'Power', status: 'Backup', color: 'text-yellow-600 bg-yellow-50' },
            ].map((item) => (
              <div key={item.label} className='flex flex-col items-center gap-1.5 p-3 bg-muted/40 rounded-xl'>
                <div className={`p-1.5 rounded-lg ${item.color}`}>
                  <item.icon className='w-4 h-4' />
                </div>
                <span className='text-xs font-medium text-foreground'>{item.label}</span>
                <span className='text-[10px] text-muted-foreground'>{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent complaints */}
      {openComplaints.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-foreground text-sm'>Open Complaints</h3>
            <button onClick={() => navigate('/portal/complaints')} className='text-xs text-primary'>View all →</button>
          </div>
          <div className='space-y-2'>
            {openComplaints.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/portal/complaints/${c.id}`)}
                className='w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left'
              >
                <div className='p-1.5 bg-orange-50 rounded-lg flex-shrink-0'>
                  <MessageSquare className='w-4 h-4 text-orange-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-foreground truncate'>{c.title}</p>
                  <p className='text-xs text-muted-foreground capitalize'>{titleCase(c.status)}</p>
                </div>
                <ArrowRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent notifications */}
      {unreadNotifications.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-foreground text-sm'>Notifications</h3>
            <button onClick={() => navigate('/portal/notices')} className='text-xs text-primary'>View all →</button>
          </div>
          <div className='space-y-2'>
            {unreadNotifications.slice(0, 3).map((n) => (
              <div key={n.id} className='flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl'>
                <div className='p-1.5 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5'>
                  <Bell className='w-3.5 h-3.5 text-blue-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-blue-900'>{n.title}</p>
                  <p className='text-xs text-blue-700 mt-0.5'>{n.body}</p>
                  <p className='text-[10px] text-blue-500 mt-1'>{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
