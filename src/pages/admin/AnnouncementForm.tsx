import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Megaphone } from 'lucide-react'
import { createAnnouncement } from '@/services/announcementService'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Announcement } from '@/types'

export default function AnnouncementForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Partial<Announcement>>({
    defaultValues: {
      title: '',
      content: '',
      target: 'all',
      priority: 'normal',
      is_pinned: false,
    }
  })

  const target = useWatch({ control, name: 'target' })

  const mutation = useMutation({
    mutationFn: (data: Partial<Announcement>) => createAnnouncement({ ...data, created_by: user?.uid || 'system' }),
    onSuccess: () => {
      toast.success('Announcement broadcasted successfully!')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      navigate('/admin/announcements')
    },
    onError: (e: any) => toast.error(e.message || 'Failed to send announcement'),
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">New Announcement</h1>
          <p className="page-subtitle">Broadcast a message to tenants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Announcement Details
              </h2>
              
              <div>
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  {...register('title', { required: 'Title is required' })} 
                  className="form-input mt-1" 
                  placeholder="e.g. Water Supply Interruption"
                />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>

              <div>
                <label className="form-label">Message Content *</label>
                <textarea 
                  {...register('content', { required: 'Message content is required' })} 
                  className="form-input mt-1 min-h-[150px] resize-none" 
                  placeholder="Type your message here..."
                ></textarea>
                {errors.content && <p className="form-error">{errors.content.message}</p>}
              </div>
            </div>

            <div className="pg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-primary" /> Targeting & Options
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Target Audience *</label>
                  <select {...register('target')} className="form-input mt-1">
                    <option value="all">All Tenants</option>
                    <option value="property">Specific Property</option>
                    <option value="floor">Specific Floor</option>
                    <option value="room">Specific Room</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Priority Level *</label>
                  <select {...register('priority')} className="form-input mt-1">
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {target === 'property' && (
                  <div className="md:col-span-2 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm">
                    <strong>Note:</strong> Advanced targeting selectors (Property, Floor, Room dropdowns) are not implemented in this demo. Selecting these will currently fallback to all tenants.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_pinned')} className="w-5 h-5 rounded text-primary focus:ring-primary border-border" />
                  <div>
                    <p className="font-medium">Pin Announcement</p>
                    <p className="text-sm text-muted-foreground">Keep this at the top of the tenant dashboard</p>
                  </div>
                </label>
              </div>
            </div>
            
          </div>

          {/* Right Column - Summary Sticky Panel */}
          <div className="space-y-6">
            <div className="pg-card p-6 sticky top-24">
              <h3 className="font-display font-bold text-xl mb-6">Actions</h3>
              
              <p className="text-sm text-muted-foreground mb-6">
                Broadcast this message to notify tenants via their portal and registered communication channels.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Broadcast Now
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

function TargetIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}