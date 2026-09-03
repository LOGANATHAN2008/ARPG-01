import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Layers, X, Loader2, Edit, Trash2 } from 'lucide-react'
import { getFloors, createFloor, updateFloor, deleteFloor, getProperties, getBuildings } from '@/services/propertyService'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Floor } from '@/types'

export default function Floors() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: floors = [], isLoading } = useQuery({ queryKey: ['floors'], queryFn: () => getFloors() })
  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: () => getProperties(false) })
  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: () => getBuildings() })

  const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm<Partial<Floor>>()
  const selectedPropertyId = useWatch({ control, name: 'property_id' })

  useEffect(() => {
    if (properties.length === 1 && showForm) {
      setValue('property_id', properties[0].id)
    }
  }, [properties, showForm, setValue])

  // Filter buildings by selected property
  const filteredBuildings = buildings.filter(b => b.property_id === selectedPropertyId)

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Floor>) => editingId ? updateFloor(editingId, data) : createFloor(data),
    onSuccess: () => {
      toast.success(editingId ? 'Floor updated!' : 'Floor added!')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      handleCloseForm()
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save floor'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFloor(id),
    onSuccess: () => {
      toast.success('Floor deleted')
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete floor'),
  })

  const handleEdit = (f: Floor) => {
    setEditingId(f.id)
    setValue('property_id', f.property_id)
    setValue('building_id', f.building_id)
    setValue('name', f.name)
    setValue('floor_number', f.floor_number)
    setValue('total_rooms', f.total_rooms)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    reset({ name: '', property_id: '', building_id: '', floor_number: undefined, total_rooms: undefined })
  }

  return (
    <div className='space-y-6'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>Floors</h1>
          <p className='page-subtitle'>{floors.length} floors across all buildings</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className='flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors'>
            <Plus className='w-4 h-4' /> Add Floor
          </button>
        )}
      </div>

      {showForm && (
        <div className="pg-card p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Floor' : 'Add New Floor'}</h2>
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
                <label className="form-label">Building *</label>
                <select 
                  {...register('building_id', { required: 'Building is required' })} 
                  className="form-input mt-1"
                  disabled={!selectedPropertyId}
                >
                  <option value="">{selectedPropertyId ? 'Select building' : 'Select property first'}</option>
                  {filteredBuildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.building_id && <p className="form-error">{errors.building_id.message}</p>}
              </div>

              <div>
                <label className="form-label">Floor Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="form-input mt-1" placeholder="e.g. Ground Floor" />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>

              <div>
                <label className="form-label">Floor Number *</label>
                <input type="number" {...register('floor_number', { valueAsNumber: true, required: 'Required' })} className="form-input mt-1" placeholder="e.g. 0 (Ground), 1 (First)" />
                {errors.floor_number && <p className="form-error">{errors.floor_number.message}</p>}
              </div>

              <div>
                <label className="form-label">Total Rooms *</label>
                <input type="number" min={1} {...register('total_rooms', { valueAsNumber: true, required: 'Required' })} className="form-input mt-1" placeholder="e.g. 10" />
                {errors.total_rooms && <p className="form-error">{errors.total_rooms.message}</p>}
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {editingId ? 'Update Floor' : 'Save Floor'}
              </button>
              <button type="button" onClick={handleCloseForm} className="px-5 py-2 border border-border bg-card rounded-xl text-sm font-medium hover:bg-accent">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({length:6}).map((_,i)=><div key={i} className='pg-card p-5 space-y-3'><div className='shimmer h-5 w-3/4 rounded'/><div className='shimmer h-4 w-1/2 rounded'/></div>)}
        </div>
      ) : floors.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl'>
          <Layers className='w-12 h-12 text-muted-foreground/30 mb-4'/>
          <h3 className='font-semibold text-foreground mb-1'>No floors yet</h3>
          <p className='text-sm text-muted-foreground mb-4'>Create a floor after adding a building.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className='px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90'>
              Add First Floor
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {floors.map(f => (
            <div key={f.id} className='pg-card p-5 hover:border-primary/30 transition-colors group relative'>
              <div className='flex items-center justify-between mb-3'>
                <div className='p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors'>
                  <Layers className='w-5 h-5'/>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium px-2 py-1 bg-accent text-muted-foreground rounded-md">
                    Floor {f.floor_number}
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(f)} className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this floor?')) deleteMutation.mutate(f.id) }} className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <h3 className='font-semibold text-foreground text-lg truncate' title={f.name}>{f.name}</h3>
              <p className='text-sm text-muted-foreground truncate'>{(f.building as any)?.name} · {(f.property as any)?.name}</p>
              
              <div className="pt-3 border-t border-border/50 mt-3 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Rooms:</span>
                <span className="font-semibold text-foreground">{f.total_rooms}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
