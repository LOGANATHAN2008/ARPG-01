import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Complaint, ComplaintActivity, ComplaintStatus, ComplaintPriority, RaiseComplaintForm } from '@/types'

export interface ComplaintFilters {
  tenant_id?: string
  property_id?: string
  room_id?: string
  status?: ComplaintStatus
  priority?: ComplaintPriority
  category?: string
  from_date?: string
  to_date?: string
  search?: string
}

export async function getComplaints(filters: ComplaintFilters = {}): Promise<Complaint[]> {
  const complaintsRef = collection(db, 'complaints')
  let q = query(complaintsRef, where('is_deleted', '==', false))

  if (filters.tenant_id) q = query(q, where('tenant_id', '==', filters.tenant_id))
  if (filters.property_id) q = query(q, where('property_id', '==', filters.property_id))
  if (filters.room_id) q = query(q, where('room_id', '==', filters.room_id))
  if (filters.status) q = query(q, where('status', '==', filters.status))
  if (filters.priority) q = query(q, where('priority', '==', filters.priority))
  if (filters.category) q = query(q, where('category', '==', filters.category))
  if (filters.from_date) q = query(q, where('created_at', '>=', filters.from_date))
  if (filters.to_date) q = query(q, where('created_at', '<=', filters.to_date))

  const snapshot = await getDocs(q)
  let complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint))

  if (filters.search) {
    const term = filters.search.toLowerCase()
    complaints = complaints.filter(c => 
      c.title?.toLowerCase().includes(term) || 
      c.complaint_number?.toLowerCase().includes(term)
    )
  }

  // Stitch relations
  const tenantCache = new Map<string, any>()
  const propertyCache = new Map<string, any>()
  const roomCache = new Map<string, any>()

  for (const c of complaints) {
    if (c.tenant_id && !tenantCache.has(c.tenant_id)) {
      const docSnap = await getDoc(doc(db, 'tenants', c.tenant_id))
      if (docSnap.exists()) tenantCache.set(c.tenant_id, docSnap.data())
    }
    if (c.property_id && !propertyCache.has(c.property_id)) {
      const docSnap = await getDoc(doc(db, 'properties', c.property_id))
      if (docSnap.exists()) propertyCache.set(c.property_id, docSnap.data())
    }
    if (c.room_id && !roomCache.has(c.room_id)) {
      const docSnap = await getDoc(doc(db, 'rooms', c.room_id))
      if (docSnap.exists()) roomCache.set(c.room_id, docSnap.data())
    }

    c.tenant = c.tenant_id ? tenantCache.get(c.tenant_id) : undefined
    c.property = c.property_id ? propertyCache.get(c.property_id) : undefined
    c.room = c.room_id ? roomCache.get(c.room_id) : undefined
  }

  complaints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return complaints
}

export async function getComplaint(id: string): Promise<Complaint> {
  const docRef = doc(db, 'complaints', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Complaint not found')
  }
  
  const complaint = { id: snapshot.id, ...snapshot.data() } as Complaint

  if (complaint.tenant_id) {
    const tSnap = await getDoc(doc(db, 'tenants', complaint.tenant_id))
    if (tSnap.exists()) {
      complaint.tenant = tSnap.data() as any
      if (complaint.tenant?.room_id) {
        const rSnap = await getDoc(doc(db, 'rooms', complaint.tenant.room_id))
        if (rSnap.exists()) {
          complaint.tenant.room = rSnap.data() as any
        }
      }
    }
  }
  
  if (complaint.property_id) {
    const pSnap = await getDoc(doc(db, 'properties', complaint.property_id))
    if (pSnap.exists()) complaint.property = pSnap.data() as any
  }
  
  if (complaint.room_id) {
    const rSnap = await getDoc(doc(db, 'rooms', complaint.room_id))
    if (rSnap.exists()) complaint.room = rSnap.data() as any
  }

  const activityRef = collection(db, 'complaint_activity')
  const q = query(activityRef, where('complaint_id', '==', id))
  const actSnap = await getDocs(q)
  complaint.activity = actSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  complaint.activity.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return complaint
}

export async function createComplaint(
  tenantId: string,
  form: RaiseComplaintForm,
  actorId: string,
  actorName: string
): Promise<Complaint> {
  const batch = writeBatch(db)

  // Generate a random ID/number for simplicity
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  const complaintNumber = `CMP-${randomStr}`

  let property_id = null
  let room_id = null

  const tenantSnap = await getDoc(doc(db, 'tenants', tenantId))
  if (tenantSnap.exists()) {
    property_id = tenantSnap.data().property_id
    room_id = tenantSnap.data().room_id
  }

  const complaintRef = doc(collection(db, 'complaints'))
  const complaintData = {
    complaint_number: complaintNumber,
    tenant_id: tenantId,
    property_id,
    room_id,
    category: form.category,
    title: form.title,
    description: form.description,
    priority: form.priority,
    images: [],
    status: 'submitted',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  batch.set(complaintRef, complaintData)

  const activityRef = doc(collection(db, 'complaint_activity'))
  batch.set(activityRef, {
    complaint_id: complaintRef.id,
    actor_id: actorId,
    actor_name: actorName,
    actor_role: 'tenant',
    action: 'Complaint submitted',
    new_status: 'submitted',
    created_at: new Date().toISOString()
  })

  await batch.commit()
  return { id: complaintRef.id, ...complaintData } as Complaint
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  actorId: string,
  actorName: string,
  actorRole: string,
  notes?: string
): Promise<void> {
  const batch = writeBatch(db)
  const complaintRef = doc(db, 'complaints', complaintId)
  
  const complaintSnap = await getDoc(complaintRef)
  const currentStatus = complaintSnap.exists() ? complaintSnap.data().status : undefined

  const updatePayload: Record<string, any> = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  }
  
  if (newStatus === 'resolved') updatePayload.resolved_at = new Date().toISOString()
  if (newStatus === 'closed') updatePayload.closed_at = new Date().toISOString()
  if (notes) updatePayload.admin_notes = notes

  batch.update(complaintRef, updatePayload)

  const activityRef = doc(collection(db, 'complaint_activity'))
  batch.set(activityRef, {
    complaint_id: complaintId,
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    action: `Status changed to ${newStatus.replace(/_/g, ' ')}`,
    old_status: currentStatus,
    new_status: newStatus,
    notes,
    created_at: new Date().toISOString()
  })

  await batch.commit()
}

export async function assignComplaint(
  complaintId: string,
  staffId: string,
  actorId: string,
  actorName: string
): Promise<void> {
  const batch = writeBatch(db)
  const complaintRef = doc(db, 'complaints', complaintId)

  batch.update(complaintRef, {
    assigned_staff_id: staffId,
    status: 'assigned',
    updated_at: new Date().toISOString()
  })

  const activityRef = doc(collection(db, 'complaint_activity'))
  batch.set(activityRef, {
    complaint_id: complaintId,
    actor_id: actorId,
    actor_name: actorName,
    actor_role: 'admin',
    action: 'Staff assigned',
    old_status: 'acknowledged',
    new_status: 'assigned',
    created_at: new Date().toISOString()
  })

  await batch.commit()
}

export async function addComplaintActivity(
  complaintId: string,
  actorId: string,
  actorName: string,
  actorRole: string,
  action: string,
  oldStatus?: ComplaintStatus,
  newStatus?: ComplaintStatus,
  notes?: string
): Promise<void> {
  const activityRef = doc(collection(db, 'complaint_activity'))
  await setDoc(activityRef, {
    complaint_id: complaintId,
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    action,
    old_status: oldStatus,
    new_status: newStatus,
    notes,
    created_at: new Date().toISOString()
  })
}

export async function getComplaintStats(propertyId?: string) {
  const complaintsRef = collection(db, 'complaints')
  let q = query(complaintsRef, where('is_deleted', '==', false))
  if (propertyId) q = query(q, where('property_id', '==', propertyId))

  const snapshot = await getDocs(q)
  const complaints = snapshot.docs.map(doc => doc.data())

  return {
    total: complaints.length,
    open: complaints.filter((c) =>
      ['submitted', 'acknowledged', 'assigned', 'in_progress', 'waiting_for_parts', 'reopened'].includes(c.status)
    ).length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    closed: complaints.filter((c) => c.status === 'closed').length,
    high_priority: complaints.filter((c) => ['high', 'critical'].includes(c.priority)).length,
    critical: complaints.filter((c) => c.priority === 'critical').length,
    by_category: complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    by_status: complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
}
