import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Receipt } from 'lucide-react'
import { getTenants } from '@/services/tenantService'
import { createInvoice } from '@/services/invoiceService'
import toast from 'react-hot-toast'
import type { CreateInvoiceForm, Tenant } from '@/types'
import { format, addMonths } from 'date-fns'

export default function InvoiceForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch active tenants for dropdown
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants(),
  })

  // Set default dates
  const today = new Date()
  const nextMonth = addMonths(today, 1)
  
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<CreateInvoiceForm>({
    defaultValues: {
      tenant_id: '',
      billing_period_start: format(today, 'yyyy-MM-dd'),
      billing_period_end: format(nextMonth, 'yyyy-MM-dd'),
      due_date: format(addMonths(today, 1), 'yyyy-MM-05'), // Default 5th of next month
      rent_amount: 0,
      maintenance_fee: 0,
      electricity_fee: 0,
      water_fee: 0,
      other_charges: 0,
      late_fee: 0,
      discount: 0,
      notes: ''
    }
  })

  // Watch fields for live calculation
  const selectedTenantId = useWatch({ control, name: 'tenant_id' })
  const rent = useWatch({ control, name: 'rent_amount' }) || 0
  const maintenance = useWatch({ control, name: 'maintenance_fee' }) || 0
  const electricity = useWatch({ control, name: 'electricity_fee' }) || 0
  const water = useWatch({ control, name: 'water_fee' }) || 0
  const other = useWatch({ control, name: 'other_charges' }) || 0
  const lateFee = useWatch({ control, name: 'late_fee' }) || 0
  const discount = useWatch({ control, name: 'discount' }) || 0

  const subtotal = Number(rent) + Number(maintenance) + Number(electricity) + Number(water) + Number(other) + Number(lateFee)
  const total = subtotal - Number(discount)

  // Auto-fill when tenant is selected
  useEffect(() => {
    if (selectedTenantId) {
      const tenant = tenants.find((t: Tenant) => t.id === selectedTenantId)
      if (tenant) {
        setValue('rent_amount', tenant.monthly_rent || 0)
        setValue('maintenance_fee', tenant.maintenance_fee || 0)
        setValue('electricity_fee', tenant.electricity_fee || 0)
        setValue('water_fee', tenant.water_fee || 0)
        setValue('other_charges', tenant.other_charges || 0)
        
        // Auto-set due date based on tenant's payment due day
        if (tenant.payment_due_day) {
           const due = new Date(nextMonth)
           due.setDate(tenant.payment_due_day)
           setValue('due_date', format(due, 'yyyy-MM-dd'))
        }
      }
    }
  }, [selectedTenantId, tenants, setValue, nextMonth])

  const mutation = useMutation({
    mutationFn: (data: CreateInvoiceForm) => createInvoice(data),
    onSuccess: () => {
      toast.success('Invoice generated successfully!')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/admin/invoices')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to generate invoice'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">Generate Invoice</h1>
          <p className="page-subtitle">Create a new bill for a tenant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tenant Selection */}
            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-primary" /> Tenant Details
              </h2>
              <div>
                <label className="form-label">Select Tenant *</label>
                <select 
                  {...register('tenant_id', { required: 'Please select a tenant' })} 
                  className="form-input mt-1"
                  disabled={loadingTenants}
                >
                  <option value="">{loadingTenants ? 'Loading tenants...' : 'Choose a tenant'}</option>
                  {tenants.map((t: Tenant) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.room ? `Room ${t.room.room_number}` : 'No Room'})
                    </option>
                  ))}
                </select>
                {errors.tenant_id && <p className="form-error">{errors.tenant_id.message}</p>}
              </div>
            </div>

            {/* Dates */}
            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Billing Period
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Period Start *</label>
                  <input type="date" {...register('billing_period_start', { required: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Period End *</label>
                  <input type="date" {...register('billing_period_end', { required: true })} className="form-input mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Payment Due Date *</label>
                  <input type="date" {...register('due_date', { required: true })} className="form-input mt-1" />
                </div>
              </div>
            </div>

            {/* Fees Breakdown */}
            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" /> Fee Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Monthly Rent (₹) *</label>
                  <input type="number" min={0} {...register('rent_amount', { valueAsNumber: true, required: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Maintenance Fee (₹)</label>
                  <input type="number" min={0} {...register('maintenance_fee', { valueAsNumber: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Electricity Fee (₹)</label>
                  <input type="number" min={0} {...register('electricity_fee', { valueAsNumber: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Water Fee (₹)</label>
                  <input type="number" min={0} {...register('water_fee', { valueAsNumber: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Late Fee (₹)</label>
                  <input type="number" min={0} {...register('late_fee', { valueAsNumber: true })} className="form-input mt-1" />
                </div>
                <div>
                  <label className="form-label">Other Charges (₹)</label>
                  <input type="number" min={0} {...register('other_charges', { valueAsNumber: true })} className="form-input mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Discount Applied (₹)</label>
                  <input type="number" min={0} {...register('discount', { valueAsNumber: true })} className="form-input mt-1 text-green-600 font-medium" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg">Additional Notes</h2>
              <div>
                <textarea 
                  {...register('notes')} 
                  className="form-input min-h-[100px] resize-none" 
                  placeholder="Any notes for the tenant regarding this invoice..."
                ></textarea>
              </div>
            </div>
            
          </div>

          {/* Right Column - Summary Sticky Panel */}
          <div className="space-y-6">
            <div className="pg-card p-6 sticky top-24">
              <h3 className="font-display font-bold text-xl mb-6">Invoice Summary</h3>
              
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Rent</span>
                  <span>₹{Number(rent).toLocaleString()}</span>
                </div>
                {Number(maintenance) > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Maintenance</span>
                    <span>₹{Number(maintenance).toLocaleString()}</span>
                  </div>
                )}
                {Number(electricity) > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Electricity</span>
                    <span>₹{Number(electricity).toLocaleString()}</span>
                  </div>
                )}
                {Number(water) > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Water</span>
                    <span>₹{Number(water).toLocaleString()}</span>
                  </div>
                )}
                {Number(other) > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Other Charges</span>
                    <span>₹{Number(other).toLocaleString()}</span>
                  </div>
                )}
                {Number(lateFee) > 0 && (
                  <div className="flex justify-between items-center text-red-500/80">
                    <span>Late Fee</span>
                    <span>+ ₹{Number(lateFee).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-border/50"></div>
                <div className="flex justify-between items-center font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                {Number(discount) > 0 && (
                  <div className="flex justify-between items-center text-green-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{Number(discount).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Due</span>
                  <span className="font-bold text-xl text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !selectedTenantId} 
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Generate Invoice
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate(-1)} 
                  className="w-full px-6 py-3 border border-border bg-card hover:bg-accent rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CalendarIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}