import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Layers, Building2, X, Loader2, Edit, Trash2 } from 'lucide-react'
import { getBuildings, createBuilding, updateBuilding, deleteBuilding, getProperties } from '@/services/propertyService'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Building } from '@/types'

export default function Buildings() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: buildings = [], isLoading } = useQuery({ queryKey: ['buildings'], queryFn: () => getBuildings() })
  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: () => getProperties(false) })

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<Partial<Building>>()

  useEffect(() => {
    if (properties.length === 1 && showForm && !editingId) {
      setValue('property_id', properties[0].id)
    }
  }, [properties, showForm, editingId, setValue])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Building>) => editingId ? updateBuilding(editingId, data) : createBuilding(data),
    onSuccess: () => {
      toast.success(editingId ? 'Building updated!' : 'Building added!')
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      handleCloseForm()
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save building'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBuilding(id),
    onSuccess: () => {
      toast.success('Building deleted')
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete building'),
  })

  const handleEdit = (b: Building) => {
    setEditingId(b.id)
    setValue('name', b.name)
    setValue('code', b.code)
    setValue('property_id', b.property_id)
    setValue('total_floors', b.total_floors)
    setValue('description', b.description)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    reset({ name: '', code: '', property_id: '', total_floors: undefined, description: '' })
  }

  return (
    <div className='space-y-6'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Buildings</h1>
          <p className='page-subtitle'>{buildings.length} buildings across all properties</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors'>
            <Plus className='w-4 h-4' /> Add Building
          </button>
        )}
      </div>

      {showForm && (
        <div className="pg-card p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Building' : 'Add New Building'}</h2>
            <button onClick={handleCloseForm} className="p-1 hover:bg-accent rounded-lg"><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Property *</label>
                <select {...register('property_id', { required: 'Property is required' })} className="form-input mt-1">
                  <option value="">Select property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.property_id && <p className="form-error">{errors.property_id.message}</p>}
              </div>
              <div>
                <label className="form-label">Building Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="form-input mt-1" placeholder="e.g. A-Block" />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="form-label">Building Code *</label>
                <input {...register('code', { required: 'Code is required' })} className="form-input mt-1" placeholder="e.g. BLK-A" />
                {errors.code && <p className="form-error">{errors.code.message}</p>}
              </div>
              <div>
                <label className="form-label">Total Floors *</label>
                <input type="number" min={1} {...register('total_floors', { valueAsNumber: true, required: 'Required' })} className="form-input mt-1" placeholder="e.g. 5" />
                {errors.total_floors && <p className="form-error">{errors.total_floors.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Description (Optional)</label>
                <input {...register('description')} className="form-input mt-1" placeholder="Brief description of the building..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {editingId ? 'Update Building' : 'Save Building'}
              </button>
              <button type="button" onClick={handleCloseForm} className="px-5 py-2 border border-border bg-card rounded-xl text-sm font-medium hover:bg-accent">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({length:4}).map((_,i)=><div key={i} className='pg-card p-6 space-y-3'><div className='shimmer h-5 w-3/4 rounded'/><div className='shimmer h-4 w-1/2 rounded'/></div>)}
        </div>
      ) : buildings.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl'>
          <Building2 className='w-12 h-12 text-muted-foreground/30 mb-4'/>
          <h3 className='font-semibold text-foreground mb-1'>No buildings yet</h3>
          <p className='text-sm text-muted-foreground mb-4'>Create a building to start organizing your rooms.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className='px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90'>
              Add First Building
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {buildings.map(b => (
            <div key={b.id} className='pg-card p-5 hover:border-primary/30 transition-colors group relative'>
              <div className='flex items-start justify-between mb-3'>
                <div className='p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors'>
                  <Layers className='w-5 h-5'/>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium px-2 py-1 bg-accent text-muted-foreground rounded-md">
                    {b.code}
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(b)} className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this building?')) deleteMutation.mutate(b.id) }} className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <h3 className='font-semibold text-foreground text-lg'>{b.name}</h3>
              <p className='text-sm text-muted-foreground mb-3'>{(b.property as any)?.name}</p>
              
              <div className="pt-3 border-t border-border/50 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Floors:</span>
                <span className="font-semibold text-foreground">{b.total_floors}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

