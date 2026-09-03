import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Tenant, TenantStatus, CreateTenantForm } from '@/types'

export interface TenantFilters {
  property_id?: string
  room_id?: string
  floor_id?: string
  status?: TenantStatus
  gender?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getTenants(filters: TenantFilters = {}): Promise<Tenant[]> {
  const tenantsRef = collection(db, 'tenants')
  let q = query(tenantsRef) // Fetch all, filter in memory to avoid composite index errors

  const snapshot = await getDocs(q)
  let tenants = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Tenant))
    .filter(t => !t.is_deleted) // Filter out deleted tenants first

  if (filters.property_id) tenants = tenants.filter(t => t.property_id === filters.property_id)
  if (filters.room_id) tenants = tenants.filter(t => t.room_id === filters.room_id)
  if (filters.floor_id) tenants = tenants.filter(t => t.floor_id === filters.floor_id)
  if (filters.status) tenants = tenants.filter(t => t.status === filters.status)
  if (filters.gender) tenants = tenants.filter(t => t.gender === filters.gender)

  if (filters.search) {
    const term = filters.search.toLowerCase()
    tenants = tenants.filter(t => 
      t.full_name?.toLowerCase().includes(term) || 
      t.phone?.toLowerCase().includes(term) || 
      t.email?.toLowerCase().includes(term)
    )
  }

  // Stitch relations
  const propertyCache = new Map<string, any>()
  const roomCache = new Map<string, any>()
  const bedCache = new Map<string, any>()

  for (const t of tenants) {
    if (t.property_id && !propertyCache.has(t.property_id)) {
      const docSnap = await getDoc(doc(db, 'properties', t.property_id))
      if (docSnap.exists()) propertyCache.set(t.property_id, docSnap.data())
    }
    if (t.room_id && !roomCache.has(t.room_id)) {
      const docSnap = await getDoc(doc(db, 'rooms', t.room_id))
      if (docSnap.exists()) roomCache.set(t.room_id, docSnap.data())
    }
    if (t.bed_id && !bedCache.has(t.bed_id)) {
      const docSnap = await getDoc(doc(db, 'beds', t.bed_id))
      if (docSnap.exists()) bedCache.set(t.bed_id, docSnap.data())
    }

    t.property = t.property_id ? propertyCache.get(t.property_id) : undefined
    t.room = t.room_id ? roomCache.get(t.room_id) : undefined
    t.bed = t.bed_id ? bedCache.get(t.bed_id) : undefined
  }

  tenants.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  return tenants
}

export async function getTenant(id: string): Promise<Tenant> {
  const docRef = doc(db, 'tenants', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Tenant not found')
  }
  
  const tenant = { id: snapshot.id, ...snapshot.data() } as Tenant

  if (tenant.property_id) {
    const pSnap = await getDoc(doc(db, 'properties', tenant.property_id))
    if (pSnap.exists()) tenant.property = pSnap.data() as any
  }
  
  if (tenant.room_id) {
    const rSnap = await getDoc(doc(db, 'rooms', tenant.room_id))
    if (rSnap.exists()) {
      tenant.room = rSnap.data() as any
      if (tenant.room?.floor_id) {
        const fSnap = await getDoc(doc(db, 'floors', tenant.room.floor_id))
        if (fSnap.exists()) tenant.room.floor = fSnap.data() as any
      }
      if (tenant.room?.building_id) {
        const bSnap = await getDoc(doc(db, 'buildings', tenant.room.building_id))
        if (bSnap.exists()) tenant.room.building = bSnap.data() as any
      }
    }
  }

  if (tenant.bed_id) {
    const bSnap = await getDoc(doc(db, 'beds', tenant.bed_id))
    if (bSnap.exists()) tenant.bed = bSnap.data() as any
  }

  return tenant
}

export async function getTenantByUserId(userId: string): Promise<Tenant | null> {
  const tenantsRef = collection(db, 'tenants')
  const q = query(tenantsRef, where('user_id', '==', userId), where('is_deleted', '==', false))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  
  const tenant = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Tenant
  return getTenant(tenant.id)
}

export async function createTenant(payload: CreateTenantForm): Promise<Tenant> {
  const batch = writeBatch(db)
  
  const tenantRef = doc(collection(db, 'tenants'))
  const tenantData = {
    ...payload,
    status: 'pending_verification',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  batch.set(tenantRef, tenantData)

  if (payload.room_id && payload.bed_id) {
    const assignmentRef = doc(collection(db, 'room_assignments'))
    batch.set(assignmentRef, {
      tenant_id: tenantRef.id,
      property_id: payload.property_id,
      room_id: payload.room_id,
      bed_id: payload.bed_id,
      assigned_date: payload.joining_date,
      is_current: true,
      created_at: new Date().toISOString()
    })

    const bedRef = doc(db, 'beds', payload.bed_id)
    batch.update(bedRef, { status: 'occupied', current_tenant_id: tenantRef.id, updated_at: new Date().toISOString() })
  }

  await batch.commit()
  return { id: tenantRef.id, ...tenantData } as Tenant
}

export async function updateTenant(id: string, payload: Partial<Tenant>): Promise<Tenant> {
  const docRef = doc(db, 'tenants', id)
  await updateDoc(docRef, { ...payload, updated_at: new Date().toISOString() })
  return getTenant(id)
}

export async function updateTenantStatus(id: string, status: TenantStatus): Promise<void> {
  const docRef = doc(db, 'tenants', id)
  await updateDoc(docRef, { status, updated_at: new Date().toISOString() })
}

export async function deleteTenant(id: string): Promise<void> {
  const docRef = doc(db, 'tenants', id)
  await updateDoc(docRef, { 
    is_deleted: true, 
    status: 'checked_out', 
    actual_checkout_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  })
}

export async function checkOutTenant(tenantId: string, checkoutDate: string): Promise<void> {
  const batch = writeBatch(db)
  
  const tenantRef = doc(db, 'tenants', tenantId)
  const tenantSnap = await getDoc(tenantRef)
  
  if (tenantSnap.exists()) {
    const tenant = tenantSnap.data()
    
    batch.update(tenantRef, {
      status: 'checked_out',
      actual_checkout_date: checkoutDate,
      updated_at: new Date().toISOString()
    })

    if (tenant.bed_id) {
      const bedRef = doc(db, 'beds', tenant.bed_id)
      batch.update(bedRef, { status: 'available', current_tenant_id: null, updated_at: new Date().toISOString() })
    }

    const assignmentsRef = collection(db, 'room_assignments')
    const q = query(assignmentsRef, where('tenant_id', '==', tenantId), where('is_current', '==', true))
    const assignmentsSnap = await getDocs(q)
    
    assignmentsSnap.forEach((assignmentDoc) => {
      batch.update(assignmentDoc.ref, { vacated_date: checkoutDate, is_current: false, updated_at: new Date().toISOString() })
    })

    await batch.commit()
  }
}

export async function inviteTenant(tenantId: string, email: string): Promise<void> {
  const docRef = doc(db, 'tenants', tenantId)
  await updateDoc(docRef, { status: 'active', updated_at: new Date().toISOString() })
}

export async function getRoommates(roomId: string, excludeTenantId?: string): Promise<any[]> {
  const tenantsRef = collection(db, 'tenants')
  let q = query(tenantsRef, where('room_id', '==', roomId), where('status', '==', 'active'), where('is_deleted', '==', false))
  const snapshot = await getDocs(q)
  
  let roommates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
  
  if (excludeTenantId) {
    roommates = roommates.filter(r => r.id !== excludeTenantId)
  }

  for (const r of roommates) {
    if (r.bed_id) {
      const bedSnap = await getDoc(doc(db, 'beds', r.bed_id))
      if (bedSnap.exists()) r.bed = bedSnap.data()
    }
  }

  return roommates
}

export async function getTenantPaymentSummary(tenantId: string) {
  const invoicesRef = collection(db, 'invoices')
  const q = query(invoicesRef, where('tenant_id', '==', tenantId), where('is_deleted', '==', false))
  const snapshot = await getDocs(q)
  
  const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
  
  // Sort by created_at desc manually since we might not have a composite index on tenant_id + created_at
  invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pending = invoices.filter((i) => ['pending', 'overdue', 'partially_paid'].includes(i.status))
  const totalPending = pending.reduce((sum, i) => sum + Number(i.balance_due), 0)
  const lastInvoice = invoices[0]

  return { invoices, totalPending, lastInvoice }
}
