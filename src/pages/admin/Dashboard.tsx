import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, Bed, CreditCard, AlertCircle,
  TrendingUp, DoorOpen, FileText, Plus, IndianRupee,
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  RefreshCw, Megaphone, UserPlus, BedDouble
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getDashboardStats } from '@/services/dashboardService'
import { getMonthlyRevenueTrend } from '@/services/paymentService'
import { getComplaintStats } from '@/services/complaintService'
import { subscribeToPayments, subscribeToComplaints } from '@/services/notificationService'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatCurrencyCompact, formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

// ─── Animated stat card ───
function StatCard({
  label, value, icon: Icon, color, trend, trendLabel, onClick, delay = 0,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: number
  trendLabel?: string
  onClick?: () => void
  delay?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''))
    if (isNaN(num)) return
    let start = 0
    const step = num / 30
    const timer = setInterval(() => {
      start += step
      if (start >= num) { setDisplayValue(num); clearInterval(timer) }
      else setDisplayValue(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {onClick && <ArrowUpRight className="w-4 h-4 text-muted-foreground/50" />}
      </div>
      <div>
        <p className="stat-card-value">
          {typeof value === 'string' && value.includes('₹')
            ? value
            : typeof value === 'number'
            ? displayValue.toLocaleString('en-IN')
            : value}
        </p>
        <p className="stat-card-label">{label}</p>
      </div>
      {trend !== undefined && (
        <div className={trend >= 0 ? 'stat-card-trend-up' : 'stat-card-trend-down'}>
          <TrendingUp className="w-3 h-3" />
          <span>{Math.abs(trend)}% {trendLabel || 'vs last month'}</span>
        </div>
      )}
    </motion.div>
  )
}

const COMPLAINT_COLORS = {
  submitted: '#3B5BDB',
  in_progress: '#F59E0B',
  resolved: '#10B981',
  closed: '#6B7280',
}

const PIE_COLORS = ['#3B5BDB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    refetchInterval: 60_000,
  })

  const { data: revenueTrend = [] } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: () => getMonthlyRevenueTrend(6),
    refetchInterval: 120_000,
  })

  const { data: complaintStats } = useQuery({
    queryKey: ['complaint-stats'],
    queryFn: () => getComplaintStats(),
    refetchInterval: 60_000,
  })

  // Real-time updates
  useEffect(() => {
    const paymentChannel = subscribeToPayments('', (payment: any) => {
      if (['success', 'manually_verified'].includes(payment.status)) {
        toast.success(`💳 Payment received: ${formatCurrency(payment.amount)}`)
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        setLastUpdated(new Date())
      }
    })

    const complaintChannel = subscribeToComplaints('', (payload: any) => {
      if (payload.eventType === 'INSERT') {
        toast(`🔔 New complaint: ${payload.new?.title}`, { icon: '⚠️' })
        queryClient.invalidateQueries({ queryKey: ['complaint-stats'] })
        setLastUpdated(new Date())
      }
    })

    return () => {
      try {
        (paymentChannel as any).unsubscribe?.()
        ;(complaintChannel as any).unsubscribe?.()
      } catch (_) {}
    }
  }, [queryClient])

  // Complaint category chart data
  const complaintCategoryData = Object.entries(complaintStats?.by_category || {}).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: count as number,
  }))

  const occupancyData = stats ? [
    { name: 'Occupied', value: stats.occupied_beds },
    { name: 'Available', value: stats.available_beds },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0]}! 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
          <button
            onClick={() => { refetchStats(); setLastUpdated(new Date()) }}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {[
          { label: 'Add Tenant', icon: UserPlus, to: '/admin/tenants/new', color: 'bg-blue-500' },
          { label: 'Generate Invoice', icon: FileText, to: '/admin/invoices/new', color: 'bg-emerald-500' },
          { label: 'Add Property', icon: Building2, to: '/admin/properties/new', color: 'bg-purple-500' },
          { label: 'Add Room', icon: DoorOpen, to: '/admin/rooms/new', color: 'bg-amber-500' },
          { label: 'Announcement', icon: Megaphone, to: '/admin/announcements/new', color: 'bg-pink-500' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-accent
                       text-sm font-medium text-foreground transition-all hover:shadow-sm"
          >
            <div className={`p-1 rounded-lg ${action.color}`}>
              <action.icon className="w-3 h-3 text-white" />
            </div>
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Properties"
          value={stats?.total_properties || 0}
          icon={Building2}
          color="bg-blue-50 text-blue-600"
          onClick={() => navigate('/admin/properties')}
          delay={0.05}
        />
        <StatCard
          label="Total Rooms"
          value={stats?.total_rooms || 0}
          icon={DoorOpen}
          color="bg-purple-50 text-purple-600"
          onClick={() => navigate('/admin/rooms')}
          delay={0.1}
        />
        <StatCard
          label="Total Beds"
          value={stats?.total_beds || 0}
          icon={BedDouble}
          color="bg-indigo-50 text-indigo-600"
          onClick={() => navigate('/admin/beds')}
          delay={0.15}
        />
        <StatCard
          label="Occupied Beds"
          value={stats?.occupied_beds || 0}
          icon={Bed}
          color="bg-emerald-50 text-emerald-600"
          delay={0.2}
        />
        <StatCard
          label="Occupancy"
          value={`${stats?.occupancy_percent || 0}%`}
          icon={TrendingUp}
          color="bg-teal-50 text-teal-600"
          delay={0.25}
        />
        <StatCard
          label="Active Tenants"
          value={stats?.active_tenants || 0}
          icon={Users}
          color="bg-cyan-50 text-cyan-600"
          onClick={() => navigate('/admin/tenants')}
          delay={0.3}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrencyCompact(stats?.monthly_expected_revenue || 0)}
          icon={IndianRupee}
          color="bg-green-50 text-green-600"
          delay={0.35}
        />
        <StatCard
          label="Collected"
          value={formatCurrencyCompact(stats?.monthly_collected_revenue || 0)}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
          onClick={() => navigate('/admin/payments')}
          delay={0.4}
        />
        <StatCard
          label="Pending"
          value={formatCurrencyCompact(stats?.monthly_pending_revenue || 0)}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          onClick={() => navigate('/admin/invoices')}
          delay={0.45}
        />
        <StatCard
          label="Overdue"
          value={formatCurrencyCompact(stats?.monthly_overdue_revenue || 0)}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          onClick={() => navigate('/admin/invoices?status=overdue')}
          delay={0.5}
        />
        <StatCard
          label="Open Complaints"
          value={stats?.open_complaints || 0}
          icon={AlertCircle}
          color="bg-orange-50 text-orange-600"
          onClick={() => navigate('/admin/complaints')}
          delay={0.55}
        />
        <StatCard
          label="High Priority"
          value={stats?.high_priority_complaints || 0}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          onClick={() => navigate('/admin/complaints?priority=high')}
          delay={0.6}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <div className="pg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">Revenue Trend</h2>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-200 font-medium">
              {formatCurrencyCompact(stats?.monthly_collected_revenue || 0)} this month
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B5BDB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B5BDB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => formatCurrencyCompact(v)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) || 0), 'Collected']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#3B5BDB"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy donut */}
        <div className="pg-card p-6">
          <h2 className="font-semibold text-foreground mb-1">Bed Occupancy</h2>
          <p className="text-sm text-muted-foreground mb-4">Current status</p>
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx={85}
                    cy={85}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#3B5BDB" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-display text-foreground">
                  {stats?.occupancy_percent || 0}%
                </span>
                <span className="text-xs text-muted-foreground">Occupied</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {[
              { label: 'Occupied', value: stats?.occupied_beds || 0, color: 'bg-blue-500' },
              { label: 'Available', value: stats?.available_beds || 0, color: 'bg-slate-200' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complaint stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By category */}
        <div className="pg-card p-6">
          <h2 className="font-semibold text-foreground mb-1">Complaints by Category</h2>
          <p className="text-sm text-muted-foreground mb-4">All time distribution</p>
          {complaintCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complaintCategoryData.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '13px' }}
                />
                <Bar dataKey="value" fill="#3B5BDB" radius={[0, 4, 4, 0]}>
                  {complaintCategoryData.slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No complaint data yet
            </div>
          )}
        </div>

        {/* Payment method distribution */}
        <div className="pg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground">Payment Collection</h2>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                label: 'Collected',
                value: stats?.monthly_collected_revenue || 0,
                total: stats?.monthly_expected_revenue || 1,
                color: 'bg-emerald-500',
              },
              {
                label: 'Pending',
                value: stats?.monthly_pending_revenue || 0,
                total: stats?.monthly_expected_revenue || 1,
                color: 'bg-amber-500',
              },
              {
                label: 'Overdue',
                value: stats?.monthly_overdue_revenue || 0,
                total: stats?.monthly_expected_revenue || 1,
                color: 'bg-red-500',
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.value / item.total) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((item.value / (item.total || 1)) * 100)}% of expected
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Complaint summary */}
        <div className="pg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Complaint Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Complaints', value: complaintStats?.total || 0, icon: '📋' },
              { label: 'Open', value: complaintStats?.open || 0, icon: '🔴' },
              { label: 'Resolved', value: complaintStats?.resolved || 0, icon: '✅' },
              { label: 'Critical', value: complaintStats?.critical || 0, icon: '🚨' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="font-semibold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/admin/complaints')}
            className="mt-4 w-full text-sm text-primary hover:text-primary/80 font-medium text-center"
          >
            View all complaints →
          </button>
        </div>

        {/* Tenant summary */}
        <div className="pg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Tenant Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Tenants', value: stats?.total_tenants || 0, icon: '👥' },
              { label: 'Active', value: stats?.active_tenants || 0, icon: '✅' },
              { label: 'Pending Verification', value: stats?.pending_tenants || 0, icon: '⏳' },
              { label: 'Notice Period', value: stats?.notice_period_tenants || 0, icon: '📢' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="font-semibold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/admin/tenants')}
            className="mt-4 w-full text-sm text-primary hover:text-primary/80 font-medium text-center"
          >
            Manage tenants →
          </button>
        </div>

        {/* Invoice summary */}
        <div className="pg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Invoice Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Today Revenue', value: formatCurrency(stats?.today_revenue || 0), icon: '💰' },
              { label: 'Pending Invoices', value: stats?.pending_invoices || 0, icon: '📄' },
              { label: 'Overdue Invoices', value: stats?.overdue_invoices || 0, icon: '⚠️' },
              { label: 'New Enquiries', value: stats?.new_enquiries || 0, icon: '📩' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="font-semibold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="mt-4 w-full text-sm text-primary hover:text-primary/80 font-medium text-center"
          >
            View invoices →
          </button>
        </div>
      </div>
    </div>
  )
}
