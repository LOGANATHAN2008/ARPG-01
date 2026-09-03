import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Eye, RefreshCw, Filter, AlertTriangle, Search } from 'lucide-react'
import { getComplaints } from '@/services/complaintService'
import { formatDateTime, getComplaintStatusColor, getPriorityColor, titleCase } from '@/utils'
import type { ComplaintStatus, ComplaintPriority } from '@/types'

const PRIORITY_ICONS: Record<string, string> = {
  low: '🟢', medium: '🟡', high: '🟠', critical: '🔴',
}

export default function Complaints() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | ComplaintPriority>('all')

  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['complaints', statusFilter, priorityFilter],
    queryFn: () => getComplaints({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    }),
  })

  const filtered = complaints.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.complaint_number.toLowerCase().includes(search.toLowerCase())
  )

  const openCount = complaints.filter((c) =>
    ['submitted','acknowledged','assigned','in_progress','waiting_for_parts'].includes(c.status)
  ).length

  return (
    <div className='space-y-6'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Complaints</h1>
          <p className='page-subtitle'>{complaints.length} total · {openCount} open</p>
        </div>
        <button onClick={() => refetch()} className='p-2 rounded-xl hover:bg-accent text-muted-foreground'>
          <RefreshCw className='w-4 h-4'/>
        </button>
      </div>

      {/* Status tabs */}
      <div className='flex flex-wrap gap-2'>
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'acknowledged', label: 'Acknowledged' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-muted rounded-xl px-3 py-2 min-w-[200px]'>
          <Search className='w-4 h-4 text-muted-foreground'/>
          <input type='text' placeholder='Search complaints…' value={search} onChange={e => setSearch(e.target.value)} className='bg-transparent flex-1 outline-none text-sm'/>
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className='form-input py-2 max-w-[140px]'>
          <option value='all'>All Priority</option>
          <option value='critical'>🔴 Critical</option>
          <option value='high'>🟠 High</option>
          <option value='medium'>🟡 Medium</option>
          <option value='low'>🟢 Low</option>
        </select>
      </div>

      {/* Complaints grid */}
      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className='pg-card p-5 space-y-3'>
              <div className='shimmer h-5 w-3/4 rounded'/>
              <div className='shimmer h-4 w-full rounded'/>
              <div className='shimmer h-16 rounded'/>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20'>
          <MessageSquare className='w-12 h-12 text-muted-foreground/30 mb-4'/>
          <h3 className='font-semibold mb-1'>No complaints found</h3>
          <p className='text-sm text-muted-foreground'>
            {search ? 'No results for your search.' : 'Great! No complaints at this time.'}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filtered.map((complaint) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='pg-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow'
              onClick={() => navigate(`/admin/complaints/${complaint.id}`)}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>{PRIORITY_ICONS[complaint.priority]}</span>
                  <span className='font-mono text-xs text-muted-foreground'>{complaint.complaint_number}</span>
                </div>
                <span className={`badge ${getComplaintStatusColor(complaint.status)}`}>
                  {titleCase(complaint.status)}
                </span>
              </div>

              <h3 className='font-semibold text-foreground mb-1 line-clamp-1'>{complaint.title}</h3>
              <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>{complaint.description}</p>

              <div className='flex items-center gap-2 mb-3'>
                <span className={`badge ${getPriorityColor(complaint.priority)} text-xs`}>
                  {titleCase(complaint.priority)}
                </span>
                <span className='badge bg-muted border-border text-muted-foreground text-xs capitalize'>
                  {complaint.category}
                </span>
              </div>

              <div className='flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3'>
                <div>
                  <p className='font-medium text-foreground'>{(complaint.tenant as any)?.full_name}</p>
                  <p>Room {(complaint.room as any)?.room_number}</p>
                </div>
                <span>{formatDateTime(complaint.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
