import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getProperty, createProperty, updateProperty } from '@/services/propertyService'
import toast from 'react-hot-toast'

export default function PropertyForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
    enabled: isEdit,
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      code: '',
      address: '',
      area: '',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '',
      contact_number: '',
      whatsapp_number: '',
      email: '',
      description: '',
      rules: '',
      rent_cycle_day: 5,
      status: 'active',
    },
    values: existing ? {
      name: existing.name,
      code: existing.code,
      address: existing.address,
      area: existing.area,
      city: existing.city,
      state: existing.state,
      pincode: existing.pincode,
      contact_number: existing.contact_number,
      whatsapp_number: existing.whatsapp_number,
      email: existing.email || '',
      description: existing.description || '',
      rules: existing.rules || '',
      rent_cycle_day: existing.rent_cycle_day,
      status: existing.status,
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateProperty(id!, data) : createProperty(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Property updated!' : 'Property created!')
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      navigate('/admin/properties')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save property'),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Property' : 'Add Property'}</h1>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="pg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">PG Name *</label>
              <input {...register('name', { required: true })} className="form-input mt-1" placeholder="Koramangala Elite PG" />
            </div>
            <div>
              <label className="form-label">Property Code *</label>
              <input {...register('code', { required: true })} className="form-input mt-1" placeholder="KOR-01" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address *</label>
              <input {...register('address', { required: true })} className="form-input mt-1" placeholder="47, 6th Block, Koramangala" />
            </div>
            <div>
              <label className="form-label">Area *</label>
              <input {...register('area', { required: true })} className="form-input mt-1" placeholder="Koramangala" />
            </div>
            <div>
              <label className="form-label">Pincode *</label>
              <input {...register('pincode', { required: true })} className="form-input mt-1" placeholder="560034" maxLength={6} />
            </div>
            <div>
              <label className="form-label">Contact Number *</label>
              <input {...register('contact_number', { required: true })} className="form-input mt-1" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="form-label">WhatsApp *</label>
              <input {...register('whatsapp_number', { required: true })} className="form-input mt-1" placeholder="919876543210" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input {...register('email')} type="email" className="form-input mt-1" placeholder="pg@example.com" />
            </div>
            <div>
              <label className="form-label">Rent Due Day</label>
              <input {...register('rent_cycle_day', { valueAsNumber: true })} type="number" min={1} max={28} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-input mt-1">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} rows={3} className="form-input mt-1" placeholder="Brief description of the PG..." />
          </div>
          <div>
            <label className="form-label">Rules (one per line)</label>
            <textarea {...register('rules')} rows={5} className="form-input mt-1" placeholder="1. Entry allowed till 10 PM..." />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
