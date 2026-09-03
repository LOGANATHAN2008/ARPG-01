import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Invoice, InvoiceStatus, CreateInvoiceForm } from '@/types'

export interface InvoiceFilters {
  tenant_id?: string
  property_id?: string
  status?: InvoiceStatus
  billing_month?: string
  from_date?: string
  to_date?: string
  page?: number
  pageSize?: number
  search?: string
}

export async function getInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
  const invoicesRef = collection(db, 'invoices')
  let q = query(invoicesRef, where('is_deleted', '==', false))

  if (filters.tenant_id) q = query(q, where('tenant_id', '==', filters.tenant_id))
  if (filters.property_id) q = query(q, where('property_id', '==', filters.property_id))
  if (filters.status) q = query(q, where('status', '==', filters.status))
  if (filters.from_date) q = query(q, where('billing_period_start', '>=', filters.from_date))
  if (filters.to_date) q = query(q, where('billing_period_end', '<=', filters.to_date))

  const snapshot = await getDocs(q)
  let invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice))

  if (filters.search) {
    const term = filters.search.toLowerCase()
    invoices = invoices.filter(i => i.invoice_number?.toLowerCase().includes(term))
  }

  // Stitch relations
  const tenantCache = new Map<string, any>()
  const propertyCache = new Map<string, any>()
  const roomCache = new Map<string, any>()
  const bedCache = new Map<string, any>()

  for (const i of invoices) {
    if (i.tenant_id && !tenantCache.has(i.tenant_id)) {
      const docSnap = await getDoc(doc(db, 'tenants', i.tenant_id))
      if (docSnap.exists()) tenantCache.set(i.tenant_id, docSnap.data())
    }
    if (i.property_id && !propertyCache.has(i.property_id)) {
      const docSnap = await getDoc(doc(db, 'properties', i.property_id))
      if (docSnap.exists()) propertyCache.set(i.property_id, docSnap.data())
    }
    if (i.room_id && !roomCache.has(i.room_id)) {
      const docSnap = await getDoc(doc(db, 'rooms', i.room_id))
      if (docSnap.exists()) roomCache.set(i.room_id, docSnap.data())
    }
    if (i.bed_id && !bedCache.has(i.bed_id)) {
      const docSnap = await getDoc(doc(db, 'beds', i.bed_id))
      if (docSnap.exists()) bedCache.set(i.bed_id, docSnap.data())
    }

    i.tenant = i.tenant_id ? tenantCache.get(i.tenant_id) : undefined
    i.property = i.property_id ? propertyCache.get(i.property_id) : undefined
    i.room = i.room_id ? roomCache.get(i.room_id) : undefined
    ;(i as any).bed = i.bed_id ? bedCache.get(i.bed_id) : undefined
  }

  invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return invoices
}

export async function getInvoice(id: string): Promise<Invoice> {
  const docRef = doc(db, 'invoices', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Invoice not found')
  }
  
  const invoice = { id: snapshot.id, ...snapshot.data() } as Invoice

  if (invoice.tenant_id) {
    const tSnap = await getDoc(doc(db, 'tenants', invoice.tenant_id))
    if (tSnap.exists()) {
      invoice.tenant = tSnap.data() as any
      if (invoice.tenant?.room_id) {
        const rSnap = await getDoc(doc(db, 'rooms', invoice.tenant.room_id))
        if (rSnap.exists()) invoice.tenant.room = rSnap.data() as any
      }
      if (invoice.tenant?.bed_id) {
        const bSnap = await getDoc(doc(db, 'beds', invoice.tenant.bed_id))
        if (bSnap.exists()) (invoice.tenant as any).bed = bSnap.data() as any
      }
    }
  }

  if (invoice.property_id) {
    const pSnap = await getDoc(doc(db, 'properties', invoice.property_id))
    if (pSnap.exists()) invoice.property = pSnap.data() as any
  }

  if (invoice.room_id) {
    const rSnap = await getDoc(doc(db, 'rooms', invoice.room_id))
    if (rSnap.exists()) {
      invoice.room = rSnap.data() as any
      if (invoice.room?.floor_id) {
        const fSnap = await getDoc(doc(db, 'floors', invoice.room.floor_id))
        if (fSnap.exists()) invoice.room.floor = fSnap.data() as any
      }
    }
  }

  const paymentsRef = collection(db, 'payments')
  const pQuery = query(paymentsRef, where('invoice_id', '==', id))
  const pSnap = await getDocs(pQuery)
  invoice.payments = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))

  return invoice
}

export async function createInvoice(payload: CreateInvoiceForm): Promise<Invoice> {
  // Generate sequential invoice number ARPG-YYYY-XXX
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1).toISOString();
  const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();
  
  const invoicesRef = collection(db, 'invoices');
  const qStr = query(invoicesRef, where('created_at', '>=', startOfYear), where('created_at', '<=', endOfYear));
  const snapshot = await getDocs(qStr);
  const count = snapshot.docs.length + 1;
  const sequentialStr = count.toString().padStart(3, '0');
  
  const invoiceNumber = `ARPG-${year}-${sequentialStr}`;

  let property_id = null
  let room_id = null
  let bed_id = null

  const tenantSnap = await getDoc(doc(db, 'tenants', payload.tenant_id))
  if (tenantSnap.exists()) {
    const tData = tenantSnap.data()
    property_id = tData.property_id ?? null
    room_id = tData.room_id ?? null
    bed_id = tData.bed_id ?? null
  }

  const invoiceRef = doc(collection(db, 'invoices'))
  const subtotal = 
    Number(payload.rent_amount || 0) + 
    Number(payload.maintenance_fee || 0) + 
    Number(payload.electricity_fee || 0) + 
    Number(payload.water_fee || 0) + 
    Number(payload.other_charges || 0) + 
    Number(payload.late_fee || 0);
  
  const total_amount = subtotal - Number(payload.discount || 0);

  const data = {
    ...payload,
    invoice_number: invoiceNumber,
    property_id,
    room_id,
    bed_id,
    subtotal,
    total_amount,
    paid_amount: 0,
    balance_due: total_amount,
    status: 'pending',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await setDoc(invoiceRef, data)
  return { id: invoiceRef.id, ...data } as Invoice
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const docRef = doc(db, 'invoices', id)
  await updateDoc(docRef, { status, updated_at: new Date().toISOString() })
}

export async function bulkGenerateInvoices(
  tenantIds: string[],
  billingPeriodStart: string,
  billingPeriodEnd: string,
  dueDate: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const tenantId of tenantIds) {
    try {
      const tenantSnap = await getDoc(doc(db, 'tenants', tenantId))
      if (!tenantSnap.exists()) continue

      const tenant = tenantSnap.data()
      await createInvoice({
        tenant_id: tenantId,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        due_date: dueDate,
        rent_amount: tenant.monthly_rent || 0,
        maintenance_fee: tenant.maintenance_fee || 0,
        electricity_fee: tenant.electricity_fee || 0,
        water_fee: tenant.water_fee || 0,
        other_charges: tenant.other_charges || 0,
        late_fee: 0,
        discount: 0,
      })
      success++
    } catch {
      failed++
    }
  }

  return { success, failed }
}

export async function markInvoicePaid(invoiceId: string, paidAmount: number): Promise<void> {
  const docRef = doc(db, 'invoices', invoiceId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    const total_amount = docSnap.data().total_amount || 0
    const status = paidAmount >= Number(total_amount) ? 'paid' : 'partially_paid'

    await updateDoc(docRef, { status, paid_amount: paidAmount, updated_at: new Date().toISOString() })
  }
}

export async function voidInvoice(invoiceId: string): Promise<void> {
  const docRef = doc(db, 'invoices', invoiceId)
  await updateDoc(docRef, { status: 'void', updated_at: new Date().toISOString() })
}

export async function updateOverdueInvoices(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const invoicesRef = collection(db, 'invoices')
  const q = query(invoicesRef, where('status', '==', 'pending'), where('due_date', '<', today))
  
  const snapshot = await getDocs(q)
  const batch = writeBatch(db)

  snapshot.forEach(docSnap => {
    batch.update(docSnap.ref, { status: 'overdue', updated_at: new Date().toISOString() })
  })

  await batch.commit()
}

export async function getRevenueStats(propertyId?: string, from?: string, to?: string) {
  const invoicesRef = collection(db, 'invoices')
  let q = query(invoicesRef, where('is_deleted', '==', false))

  if (propertyId) q = query(q, where('property_id', '==', propertyId))
  if (from) q = query(q, where('billing_period_start', '>=', from))
  if (to) q = query(q, where('billing_period_start', '<=', to))

  const snapshot = await getDocs(q)
  const invoices = snapshot.docs.map(doc => doc.data())

  return {
    total_expected: invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    total_collected: invoices.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0),
    total_pending: invoices
      .filter((i) => ['pending', 'partially_paid'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.balance_due || 0), 0),
    total_overdue: invoices
      .filter((i) => i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.balance_due || 0), 0),
    invoice_count: invoices.length,
    paid_count: invoices.filter((i) => i.status === 'paid').length,
    pending_count: invoices.filter((i) => ['pending', 'partially_paid'].includes(i.status)).length,
    overdue_count: invoices.filter((i) => i.status === 'overdue').length,
  }
}
