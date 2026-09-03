import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2, Building, Receipt } from 'lucide-react'
import { getInvoiceSettings, updateInvoiceSettings } from '@/services/settingsService'
import toast from 'react-hot-toast'

export default function Settings() {
  const queryClient = useQueryClient()
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: getInvoiceSettings
  })

  const [formData, setFormData] = useState({
    upiId: 'atharvreddypg@upi',
    bankName: 'HDFC Bank',
    accountNumber: '5020 1234 5678 90',
    ifscCode: 'HDFC0001234'
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        upiId: settings.upiId || '',
        bankName: settings.bankName || '',
        accountNumber: settings.accountNumber || '',
        ifscCode: settings.ifscCode || ''
      })
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateInvoiceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings'] })
      toast.success('Invoice settings updated successfully!')
    },
    onError: (error) => {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>System Settings</h1>
          <p className='page-subtitle'>Manage global application settings</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="pg-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Invoice & Billing Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              These details will be printed dynamically on all generated tenant invoices.
            </p>
          </div>
          
          <div className="p-4 sm:p-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">UPI ID</label>
              <input
                type="text"
                required
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g., yourname@upi"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bank Name</label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g., HDFC Bank"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Number</label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g., 5020 1234 5678 90"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">IFSC Code</label>
              <input
                type="text"
                required
                value={formData.ifscCode}
                onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g., HDFC0001234"
              />
            </div>
          </div>
          
          <div className="p-4 sm:p-6 border-t border-border bg-muted/30 flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}