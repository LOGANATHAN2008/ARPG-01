import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getTenant, createTenant, updateTenant } from '@/services/tenantService'
import { getProperties } from '@/services/propertyService'
import { getAvailableBeds } from '@/services/roomService'
import toast from 'react-hot-toast'

export default function TenantForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => getTenant(id!),
    enabled: isEdit,
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(true),
  })

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      full_name: '',
      gender: 'male',
      phone: '',
      whatsapp_number: '',
      email: '',
      joining_date: '',
      monthly_rent: 0,
      deposit_amount: 0,
      maintenance_fee: 0,
      payment_due_day: 5,
      property_id: '',
      bed_id: '',
    },
    values: existing ? {
      full_name: existing.full_name,
      gender: existing.gender,
      phone: existing.phone,
      whatsapp_number: existing.whatsapp_number || '',
      email: existing.email || '',
      joining_date: existing.joining_date,
      monthly_rent: existing.monthly_rent,
      deposit_amount: existing.deposit_amount,
      maintenance_fee: existing.maintenance_fee,
      payment_due_day: existing.payment_due_day,
      property_id: existing.property_id || '',
      bed_id: existing.bed_id || '',
    } : undefined,
  })

  useEffect(() => {
    if (properties.length === 1 && !existing) {
      setValue('property_id', properties[0].id)
    }
  }, [properties, existing, setValue])

  const selectedPropertyId = watch('property_id')

  const { data: beds = [] } = useQuery({
    queryKey: ['available-beds', selectedPropertyId],
    queryFn: () => getAvailableBeds(selectedPropertyId),
    enabled: !!selectedPropertyId && !isEdit,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateTenant(id!, data) : createTenant(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Tenant updated!' : 'Tenant added!')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      navigate('/admin/tenants')
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Tenant' : 'Add Tenant'}</h1>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="pg-card p-6 space-y-4">
          <h2 className="font-semibold">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input {...register('full_name', { required: true })} className="form-input mt-1" placeholder="Full Name" />
            </div>
            <div>
              <label className="form-label">Gender *</label>
              <select {...register('gender', { required: true })} className="form-input mt-1">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input {...register('phone', { required: true })} className="form-input mt-1" placeholder="9876543210" />
            </div>
            <div>
              <label className="form-label">WhatsApp *</label>
              <input {...register('whatsapp_number', { required: true })} className="form-input mt-1" placeholder="9876543210" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input {...register('email')} type="email" className="form-input mt-1" placeholder="tenant@email.com" />
            </div>
            <div>
              <label className="form-label">Property *</label>
              <select {...register('property_id', { required: true })} className="form-input mt-1">
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!isEdit && (
              <div>
                <label className="form-label">Assign Bed</label>
                <select {...register('bed_id')} className="form-input mt-1" disabled={!selectedPropertyId}>
                  <option value="">{selectedPropertyId ? 'Select available bed' : 'Select property first'}</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      Room {(b.room as any)?.room_number} - Bed {b.bed_label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Joining Date *</label>
              <input {...register('joining_date', { required: true })} type="date" className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Monthly Rent (₹) *</label>
              <input {...register('monthly_rent', { valueAsNumber: true, required: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Security Deposit (₹)</label>
              <input {...register('deposit_amount', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Maintenance (₹)</label>
              <input {...register('maintenance_fee', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Rent Due Day</label>
              <input {...register('payment_due_day', { valueAsNumber: true })} type="number" min={1} max={28} className="form-input mt-1" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-border rounded-xl text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </div>
  )
}