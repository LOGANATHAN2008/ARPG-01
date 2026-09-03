import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Filter, Building2, MapPin, Phone, Mail,
  Edit, Trash2, Eye, MoreVertical, RefreshCw
} from 'lucide-react'
import { getProperties, deleteProperty } from '@/services/propertyService'
import { getPropertyOccupancyStats } from '@/services/propertyService'
import { formatCurrency, calculateOccupancy } from '@/utils'
import toast from 'react-hot-toast'
import type { Property } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  maintenance: 'badge-maintenance',
}

function PropertyCard({ property, onDelete }: { property: Property; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const { data: stats } = useQuery({
    queryKey: ['property-stats', property.id],
    queryFn: () => getPropertyOccupancyStats(property.id),
  })

  const occupancy = stats ? calculateOccupancy(stats.occupied_beds, stats.total_beds) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pg-card overflow-hidden group"
    >
      {/* Cover image */}
      <div className="h-40 bg-gradient-to-br from-brand-700 to-brand-900 relative overflow-hidden">
        {property.cover_image ? (
          <img src={property.cover_image} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`badge ${STATUS_COLORS[property.status]}`}>
            {property.status}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-bold text-sm">{property.code}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {property.name}
        </h3>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{property.area}, {property.city}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Rooms', value: stats?.total_rooms || '—' },
            { label: 'Beds', value: stats?.total_beds || '—' },
            { label: 'Occupied', value: stats?.occupied_beds || '—' },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="font-bold text-sm text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Occupancy bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Occupancy</span>
            <span className="font-medium">{occupancy}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                occupancy >= 80 ? 'bg-blue-500' : occupancy >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{property.contact_number}</span>
          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{property.email || '—'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/properties/${property.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button
            onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${property.name}"? This will set it to inactive.`)) {
                onDelete(property.id)
              }
            }}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Properties() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: properties = [], isLoading, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(true),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      toast.success('Property deactivated')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: () => toast.error('Failed to delete property'),
  })

  const filtered = properties.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.area.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{properties.length} PG properties</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin/properties/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input max-w-[140px] py-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pg-card overflow-hidden">
              <div className="shimmer h-40" />
              <div className="p-5 space-y-3">
                <div className="shimmer h-5 w-3/4 rounded" />
                <div className="shimmer h-4 w-1/2 rounded" />
                <div className="shimmer h-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No properties found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? 'No results for your search.' : 'Add your first PG property to get started.'}
          </p>
          <button
            onClick={() => navigate('/admin/properties/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
