import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Filter, Users, DoorOpen, Phone, Mail,
  Edit, Trash2, Eye, CheckCircle2, Clock, AlertTriangle,
  Download, RefreshCw, UserPlus, ChevronDown
} from 'lucide-react'
import { getTenants } from '@/services/tenantService'
import { formatDate, formatCurrency, getTenantStatusColor, titleCase, avatarFallback, csvExport } from '@/utils'
import toast from 'react-hot-toast'
import type { Tenant, TenantStatus } from '@/types'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3 h-3" />,
  notice_period: <Clock className="w-3 h-3" />,
  checked_out: <DoorOpen className="w-3 h-3" />,
  suspended: <AlertTriangle className="w-3 h-3" />,
  pending_verification: <Clock className="w-3 h-3" />,
}

export default function Tenants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all')
  const [propertyFilter, setPropertyFilter] = useState('all')

  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['tenants', { statusFilter, propertyFilter }],
    queryFn: () => getTenants({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      property_id: propertyFilter !== 'all' ? propertyFilter : undefined,
    }),
  })

  const filtered = tenants.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.phone.includes(search) ||
      t.email.toLowerCase().includes(q) ||
      (t.room as any)?.room_number?.includes(search)
    )
  })

  const handleExport = () => {
    csvExport(
      filtered.map((t) => ({
        Name: t.full_name,
        Phone: t.phone,
        Email: t.email,
        Room: (t.room as any)?.room_number || '—',
        Bed: (t.bed as any)?.bed_label || '—',
        Rent: t.monthly_rent,
        Status: t.status,
        'Joining Date': formatDate(t.joining_date),
      })),
      `tenants-${new Date().toISOString().split('T')[0]}.csv`
    )
  }

  const statusCounts: Record<string, number> = {
    all: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    notice_period: tenants.filter((t) => t.status === 'notice_period').length,
    pending_verification: tenants.filter((t) => t.status === 'pending_verification').length,
    checked_out: tenants.filter((t) => t.status === 'checked_out').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{tenants.length} total tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => navigate('/admin/tenants/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Tenant
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'notice_period', label: 'Notice Period' },
          { key: 'pending_verification', label: 'Pending' },
          { key: 'checked_out', label: 'Checked Out' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-background'
            }`}>
              {statusCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, phone, room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="pg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room / Bed</th>
                <th>Monthly Rent</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="shimmer h-5 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">
                        {search ? 'No tenants match your search' : 'No tenants yet'}
                      </p>
                      {!search && (
                        <button
                          onClick={() => navigate('/admin/tenants/new')}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                        >
                          <Plus className="w-3 h-3" /> Add First Tenant
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tenant) => (
                  <motion.tr
                    key={tenant.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
                          {tenant.profile_photo ? (
                            <img src={tenant.profile_photo} alt={tenant.full_name} className="w-full h-full object-cover" />
                          ) : (
                            avatarFallback(tenant.full_name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{tenant.full_name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(tenant.room as any)?.room_number ? (
                        <div>
                          <p className="text-sm font-medium">Room {(tenant.room as any).room_number}</p>
                          <p className="text-xs text-muted-foreground">
                            Bed {(tenant.bed as any)?.bed_label || '—'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-sm">{formatCurrency(tenant.monthly_rent)}</span>
                    </td>
                    <td>
                      <span className="text-sm">{formatDate(tenant.joining_date)}</span>
                    </td>
                    <td>
                      <span className={`badge ${getTenantStatusColor(tenant.status)} flex items-center gap-1 w-fit`}>
                        {STATUS_ICONS[tenant.status]}
                        {titleCase(tenant.status)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/tenants/${tenant.id}/edit`)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Showing {filtered.length} of {tenants.length} tenants
          </div>
        )}
      </div>
    </div>
  )
}
