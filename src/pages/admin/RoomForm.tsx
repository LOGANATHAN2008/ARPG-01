import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getRoom, createRoom, updateRoom } from '@/services/roomService'
import { getProperties } from '@/services/propertyService'
import { getBuildings, getFloors } from '@/services/propertyService'
import toast from 'react-hot-toast'

export default function RoomForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: ['room', id],
    queryFn: () => getRoom(id!),
    enabled: isEdit,
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(true),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      room_number: '',
      room_type: 'double',
      capacity: 2,
      monthly_rent: 0,
      deposit_amount: 0,
      maintenance_fee: 0,
      electricity_fee: 0,
      water_fee: 0,
      other_charges: 0,
      status: 'available',
      floor_id: '',
      building_id: '',
      property_id: '',
      description: '',
    },
    values: existing ? {
      room_number: existing.room_number,
      room_type: existing.room_type,
      capacity: existing.capacity,
      monthly_rent: existing.monthly_rent,
      deposit_amount: existing.deposit_amount,
      maintenance_fee: existing.maintenance_fee,
      electricity_fee: existing.electricity_fee,
      water_fee: existing.water_fee,
      other_charges: existing.other_charges,
      status: existing.status,
      floor_id: existing.floor_id,
      building_id: existing.building_id,
      property_id: existing.property_id,
      description: existing.description || '',
    } : undefined,
  })

  // Auto-select property if there is only one
  useEffect(() => {
    if (properties.length === 1 && !existing) {
      setValue('property_id', properties[0].id)
    }
  }, [properties, existing, setValue])

  const selectedPropertyId = watch('property_id')
  const selectedBuildingId = watch('building_id')

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', selectedPropertyId],
    queryFn: () => getBuildings(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  const { data: floors = [] } = useQuery({
    queryKey: ['floors', selectedBuildingId],
    queryFn: () => getFloors(selectedBuildingId),
    enabled: !!selectedBuildingId,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateRoom(id!, data) : createRoom(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Room updated!' : 'Room created!')
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      navigate('/admin/rooms')
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Room' : 'Add Room'}</h1>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="pg-card p-6 space-y-4">
          <h2 className="font-semibold">Room Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Property *</label>
              <select {...register('property_id', { required: true })} className="form-input mt-1">
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Building *</label>
              <select {...register('building_id', { required: true })} className="form-input mt-1" disabled={!selectedPropertyId}>
                <option value="">{selectedPropertyId ? 'Select building' : 'Select property first'}</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Floor *</label>
              <select {...register('floor_id', { required: true })} className="form-input mt-1" disabled={!selectedBuildingId}>
                <option value="">{selectedBuildingId ? 'Select floor' : 'Select building first'}</option>
                {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Room Number *</label>
              <input {...register('room_number', { required: true })} className="form-input mt-1" placeholder="101" />
            </div>
            <div>
              <label className="form-label">Room Type *</label>
              <select {...register('room_type')} className="form-input mt-1">
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
                <option value="dormitory">Dormitory</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="form-label">Capacity</label>
              <input {...register('capacity', { valueAsNumber: true })} type="number" min={1} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Monthly Rent (₹) *</label>
              <input {...register('monthly_rent', { valueAsNumber: true, required: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Deposit (₹)</label>
              <input {...register('deposit_amount', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Maintenance (₹)</label>
              <input {...register('maintenance_fee', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Electricity (₹)</label>
              <input {...register('electricity_fee', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Water (₹)</label>
              <input {...register('water_fee', { valueAsNumber: true })} type="number" min={0} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-input mt-1">
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} rows={2} className="form-input mt-1" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-border rounded-xl text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  )
}