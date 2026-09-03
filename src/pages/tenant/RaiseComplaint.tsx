import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getTenantByUserId } from '@/services/tenantService'
import { createComplaint } from '@/services/complaintService'
import type { ComplaintCategory } from '@/types'
import toast from 'react-hot-toast'

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'wifi', label: 'Internet / Wi-Fi' },
  { value: 'cleaning', label: 'Housekeeping' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]

export default function RaiseComplaint() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant', profile?.user_id],
    queryFn: () => getTenantByUserId(profile!.user_id),
    enabled: !!profile?.user_id,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      category: '' as ComplaintCategory,
      title: '',
      description: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createComplaint(tenant!.id, data, profile!.user_id, profile!.full_name || 'Tenant'),
    onSuccess: () => {
      toast.success('Complaint raised! We will look into it.')
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] })
      navigate('/portal/complaints')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to raise complaint'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="page-title">Raise Issue</h1>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="pg-card p-5 space-y-4">
          <div>
            <label className="form-label">Category *</label>
            <select {...register('category', { required: 'Category is required' })} className="form-input mt-1">
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category.message}</p>}
          </div>
          <div>
            <label className="form-label">Title *</label>
            <input
              {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })}
              placeholder="Brief summary of the issue"
              className="form-input mt-1"
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 characters' } })}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="form-input mt-1"
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>
          <div>
            <label className="form-label">Priority</label>
            <div className="flex gap-2 mt-1">
              {[
                { v: 'low', l: 'Low', color: 'bg-green-50 text-green-700 border-green-200' },
                { v: 'medium', l: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { v: 'high', l: 'High', color: 'bg-red-50 text-red-700 border-red-200' },
              ].map((p) => (
                <label
                  key={p.v}
                  className={`flex-1 flex items-center justify-center py-2 rounded-xl border-2 cursor-pointer text-sm font-medium ${p.color}`}
                >
                  <input {...register('priority')} type="radio" value={p.v} className="sr-only" />
                  {p.l}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !tenant}
          className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Submitting…</>
          ) : (
            'Submit Complaint'
          )}
        </button>
      </form>
    </div>
  )
}