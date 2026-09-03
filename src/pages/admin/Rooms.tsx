import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Filter, DoorOpen, Eye, Edit, Grid, List,
  CheckCircle2, Users, RefreshCw, ArrowUpDown
} from 'lucide-react'
import { getRooms } from '@/services/roomService'
import { getProperties } from '@/services/propertyService'
import { getFloors } from '@/services/propertyService'
import { formatCurrency, getRoomStatusColor, titleCase } from '@/utils'
import type { Room, RoomStatus } from '@/types'

const STATUS_DOT: Record<string, string> = {
  available: '🟢',
  partially_occupied: '🟡',
  full: '🔴',
  maintenance: '⚪',
  reserved: '🟣',
  blocked: '⚫',
}

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const pct = room.total_beds > 0 ? Math.round((room.occupied_beds / room.total_beds) * 100) : 0
  
  // Status styling map
  const statusStyles: Record<string, { bg: string, text: string, border: string, ring: string, icon: any }> = {
    available: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', ring: 'ring-emerald-500/20', icon: CheckCircle2 },
    partially_occupied: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20', ring: 'ring-amber-500/20', icon: Users },
    full: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20', ring: 'ring-blue-500/20', icon: Users },
    maintenance: { bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-500/20', ring: 'ring-slate-500/20', icon: DoorOpen },
  }
  
  const currentStyle = statusStyles[room.status] || statusStyles.available
  const StatusIcon = currentStyle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`group relative overflow-hidden bg-card border border-border rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      {/* Top Status Bar (Color line) */}
      <div className={`absolute top-0 inset-x-0 h-1.5 ${currentStyle.bg} opacity-80`} />
      
      {/* Background Gradient Effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-${currentStyle.bg.split(' ')[0].replace('bg-', '')}/50 to-transparent pointer-events-none`} />

      <div className='p-5 relative z-10'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div>
            <div className='flex items-center gap-2.5 mb-1'>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${currentStyle.bg} ${currentStyle.text} ring-4 ${currentStyle.ring}`}>
                <StatusIcon className='w-4 h-4' />
              </div>
              <h3 className='font-display font-bold text-xl text-foreground tracking-tight'>
                {room.room_number}
              </h3>
            </div>
            <p className='text-sm text-muted-foreground font-medium flex items-center gap-1.5 ml-10'>
              <span className='capitalize'>{room.room_type}</span>
              <span className='w-1 h-1 rounded-full bg-border' />
              <span>Floor {(room.floor as any)?.floor_number || '-'}</span>
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} border`}>
            {titleCase(room.status.replace('_', ' '))}
          </span>
        </div>

        {/* Beds visualization (Dots) */}
        <div className='bg-muted/30 rounded-xl p-3 mb-4 border border-border/50'>
          <div className='flex justify-between items-center text-xs text-muted-foreground font-medium mb-2.5 px-1'>
            <span>Beds Available</span>
            <span className={(room.total_beds - room.occupied_beds) === 0 ? 'text-destructive font-bold' : 'text-emerald-600 font-bold'}>
              {room.total_beds - room.occupied_beds} of {room.total_beds}
            </span>
          </div>
          <div className='flex gap-1.5'>
            {Array.from({ length: room.total_beds }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                  i < room.occupied_beds
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-background border-border text-muted-foreground shadow-sm'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-1 border-t border-border/50'>
          <div className='flex flex-col'>
            <span className='text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5'>Monthly Rent</span>
            <span className='text-base font-bold text-foreground font-display'>
              {formatCurrency(room.monthly_rent)}
            </span>
          </div>
          <div className='w-8 h-8 rounded-full bg-accent text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
            <ArrowUpDown className='w-4 h-4 rotate-90' />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Rooms() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | RoomStatus>('all')

  const { data: rooms = [], isLoading, refetch } = useQuery({
    queryKey: ['rooms', propertyFilter, statusFilter],
    queryFn: () => getRooms({
      property_id: propertyFilter !== 'all' ? propertyFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(true),
  })

  const filtered = rooms.filter((r) =>
    !search || r.room_number.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    available: rooms.filter((r) => r.status === 'available').length,
    partial: rooms.filter((r) => r.status === 'partially_occupied').length,
    full: rooms.filter((r) => r.status === 'full').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  }

  return (
    <div className='space-y-6'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Rooms</h1>
          <p className='page-subtitle'>{rooms.length} total rooms</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex rounded-xl border border-border overflow-hidden'>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}><Grid className='w-4 h-4'/></button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}><List className='w-4 h-4'/></button>
          </div>
          <button onClick={() => navigate('/admin/rooms/new')} className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors'>
            <Plus className='w-4 h-4'/> Add Room
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className='flex flex-wrap gap-2'>
        {[
          { label: `${stats.available} Available`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: `${stats.partial} Partial`, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: `${stats.full} Full`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: `${stats.maintenance} Maintenance`, color: 'bg-gray-50 text-gray-700 border-gray-200' },
        ].map((chip) => (
          <span key={chip.label} className={`badge ${chip.color}`}>{chip.label}</span>
        ))}
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-muted rounded-xl px-3 py-2 min-w-[180px]'>
          <Search className='w-4 h-4 text-muted-foreground'/>
          <input type='text' placeholder='Room number…' value={search} onChange={e => setSearch(e.target.value)} className='bg-transparent flex-1 outline-none text-sm'/>
        </div>
        <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className='form-input py-2 max-w-[180px]'>
          <option value='all'>All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className='form-input py-2 max-w-[160px]'>
          <option value='all'>All Status</option>
          <option value='available'>Available</option>
          <option value='partially_occupied'>Partial</option>
          <option value='full'>Full</option>
          <option value='maintenance'>Maintenance</option>
          <option value='reserved'>Reserved</option>
        </select>
        <button onClick={() => refetch()} className='p-2 rounded-xl hover:bg-accent text-muted-foreground'><RefreshCw className='w-4 h-4'/></button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {Array.from({length:10}).map((_,i) => <div key={i} className='pg-card p-4 space-y-3'><div className='shimmer h-5 w-1/2 rounded'/><div className='shimmer h-8 rounded'/><div className='shimmer h-4 rounded'/></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <DoorOpen className='w-12 h-12 text-muted-foreground/30 mb-4'/>
          <h3 className='font-semibold mb-1'>No rooms found</h3>
          <p className='text-sm text-muted-foreground mb-4'>{search ? 'No results for your search.' : 'Add your first room to get started.'}</p>
          <button onClick={() => navigate('/admin/rooms/new')} className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium'>
            <Plus className='w-4 h-4'/> Add Room
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onClick={() => navigate(`/admin/rooms/${room.id}`)}/>
          ))}
        </div>
      ) : (
        <div className='pg-card overflow-hidden'>
          <table className='w-full data-table'>
            <thead><tr><th>Room</th><th>Type</th><th>Property</th><th>Beds</th><th>Rent</th><th>Status</th><th className='text-right'>Actions</th></tr></thead>
            <tbody>
              {filtered.map(room => (
                <tr key={room.id} className='hover:bg-muted/20 cursor-pointer' onClick={() => navigate(`/admin/rooms/${room.id}`)}>
                  <td><span className='font-medium'>Room {room.room_number}</span></td>
                  <td><span className='capitalize text-sm'>{room.room_type}</span></td>
                  <td><span className='text-sm text-muted-foreground'>{(room.property as any)?.name}</span></td>
                  <td><span className='text-sm'>{room.occupied_beds}/{room.total_beds}</span></td>
                  <td><span className='font-medium text-sm'>{formatCurrency(room.monthly_rent)}</span></td>
                  <td><span className={`badge ${getRoomStatusColor(room.status)}`}>{titleCase(room.status)}</span></td>
                  <td className='text-right'><button onClick={e => { e.stopPropagation(); navigate(`/admin/rooms/${room.id}`) }} className='p-1.5 rounded-lg hover:bg-accent text-muted-foreground'><Eye className='w-4 h-4'/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
