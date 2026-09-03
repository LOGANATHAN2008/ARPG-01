import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Payment, PaymentStatus, PaymentMethod } from '@/types'
import { generatePaymentReference } from '@/utils'

export interface PaymentFilters {
  tenant_id?: string
  invoice_id?: string
  property_id?: string
  status?: PaymentStatus
  from_date?: string
  to_date?: string
}

export async function getPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  const paymentsRef = collection(db, 'payments')
  let q = query(paymentsRef, where('is_deleted', '==', false))

  if (filters.tenant_id) q = query(q, where('tenant_id', '==', filters.tenant_id))
  if (filters.invoice_id) q = query(q, where('invoice_id', '==', filters.invoice_id))
  if (filters.property_id) q = query(q, where('property_id', '==', filters.property_id))
  if (filters.status) q = query(q, where('status', '==', filters.status))
  if (filters.from_date) q = query(q, where('paid_at', '>=', filters.from_date))
  if (filters.to_date) q = query(q, where('paid_at', '<=', filters.to_date))

  const snapshot = await getDocs(q)
  const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment))

  // Stitch relations
  const tenantCache = new Map<string, any>()
  const invoiceCache = new Map<string, any>()
  const propertyCache = new Map<string, any>()
  const roomCache = new Map<string, any>()

  for (const p of payments) {
    if (p.tenant_id && !tenantCache.has(p.tenant_id)) {
      const docSnap = await getDoc(doc(db, 'tenants', p.tenant_id))
      if (docSnap.exists()) tenantCache.set(p.tenant_id, docSnap.data())
    }
    if (p.invoice_id && !invoiceCache.has(p.invoice_id)) {
      const docSnap = await getDoc(doc(db, 'invoices', p.invoice_id))
      if (docSnap.exists()) invoiceCache.set(p.invoice_id, docSnap.data())
    }
    if (p.property_id && !propertyCache.has(p.property_id)) {
      const docSnap = await getDoc(doc(db, 'properties', p.property_id))
      if (docSnap.exists()) propertyCache.set(p.property_id, docSnap.data())
    }
    if (p.room_id && !roomCache.has(p.room_id)) {
      const docSnap = await getDoc(doc(db, 'rooms', p.room_id))
      if (docSnap.exists()) roomCache.set(p.room_id, docSnap.data())
    }

    p.tenant = tenantCache.get(p.tenant_id)
    ;(p as any).invoice = invoiceCache.get(p.invoice_id)
    ;(p as any).property = propertyCache.get(p.property_id)
    ;(p as any).room = roomCache.get(p.room_id)
  }

  payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return payments
}

export async function getPayment(id: string): Promise<Payment> {
  const docRef = doc(db, 'payments', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Payment not found')
  }
  
  const payment = { id: snapshot.id, ...snapshot.data() } as Payment

  if (payment.tenant_id) {
    const tSnap = await getDoc(doc(db, 'tenants', payment.tenant_id))
    if (tSnap.exists()) payment.tenant = tSnap.data() as any
  }
  
  if (payment.invoice_id) {
    const iSnap = await getDoc(doc(db, 'invoices', payment.invoice_id))
    if (iSnap.exists()) (payment as any).invoice = iSnap.data() as any
  }
  
  if (payment.property_id) {
    const pSnap = await getDoc(doc(db, 'properties', payment.property_id))
    if (pSnap.exists()) (payment as any).property = pSnap.data() as any
  }

  return payment
}

export async function createPendingPayment(params: {
  tenant_id: string
  property_id: string
  room_id: string
  invoice_id: string
  amount: number
  gateway_order_id: string
}): Promise<Payment> {
  const reference = generatePaymentReference()
  const paymentRef = doc(collection(db, 'payments'))
  
  const data = {
    payment_reference: reference,
    tenant_id: params.tenant_id,
    property_id: params.property_id,
    room_id: params.room_id,
    invoice_id: params.invoice_id,
    amount: params.amount,
    currency: 'INR',
    payment_method: 'razorpay',
    gateway: 'razorpay',
    gateway_order_id: params.gateway_order_id,
    status: 'pending',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await setDoc(paymentRef, data)
  return { id: paymentRef.id, ...data } as Payment
}

export async function recordManualPayment(params: {
  tenant_id: string
  property_id: string
  room_id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  upi_reference?: string
  notes?: string
  paid_at: string
}): Promise<Payment> {
  const batch = writeBatch(db)
  
  const reference = generatePaymentReference()
  const paymentRef = doc(collection(db, 'payments'))
  
  const paymentData = {
    payment_reference: reference,
    ...params,
    currency: 'INR',
    gateway: 'manual',
    status: 'manually_verified',
    verified_at: new Date().toISOString(),
    verification_source: 'manual',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  batch.set(paymentRef, paymentData)

  const invoiceRef = doc(db, 'invoices', params.invoice_id)
  const invoiceSnap = await getDoc(invoiceRef)
  
  if (invoiceSnap.exists()) {
    const invoice = invoiceSnap.data()
    const newPaid = Number(invoice.paid_amount || 0) + params.amount
    const status = newPaid >= Number(invoice.total_amount || 0) ? 'paid' : 'partially_paid'
    
    batch.update(invoiceRef, { status, paid_amount: newPaid, updated_at: new Date().toISOString() })
  }

  await batch.commit()
  return { id: paymentRef.id, ...paymentData } as Payment
}

export async function verifyAndConfirmPayment(params: {
  gateway_payment_id: string
  gateway_order_id: string
  gateway_signature: string
  payment_id: string
}): Promise<void> {
  const paymentRef = doc(db, 'payments', params.payment_id)
  
  await updateDoc(paymentRef, {
    gateway_payment_id: params.gateway_payment_id,
    gateway_signature: params.gateway_signature,
    status: 'success',
    paid_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    verification_source: 'webhook',
    updated_at: new Date().toISOString()
  })
}

export async function getPaymentStats(propertyId?: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const paymentsRef = collection(db, 'payments')
  let q = query(paymentsRef, where('status', 'in', ['success', 'manually_verified']), where('is_deleted', '==', false))

  if (propertyId) q = query(q, where('property_id', '==', propertyId))

  const snapshot = await getDocs(q)
  const payments = snapshot.docs.map(doc => doc.data())

  const thisMonth = payments.filter(
    (p) => p.paid_at && new Date(p.paid_at) >= new Date(monthStart) && new Date(p.paid_at) <= new Date(monthEnd)
  )

  const byMethod: Record<string, number> = {}
  payments.forEach((p) => {
    if (p.payment_method) {
      byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount || 0)
    }
  })

  return {
    total_collected: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    month_collected: thisMonth.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    payment_count: payments.length,
    month_count: thisMonth.length,
    by_method: byMethod,
  }
}

export async function getMonthlyRevenueTrend(months = 6, propertyId?: string) {
  const result = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.toISOString().split('T')[0]
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const paymentsRef = collection(db, 'payments')
    let q = query(
      paymentsRef, 
      where('status', 'in', ['success', 'manually_verified']),
      where('paid_at', '>=', monthStart),
      where('paid_at', '<=', monthEnd + 'T23:59:59'),
      where('is_deleted', '==', false)
    )

    if (propertyId) q = query(q, where('property_id', '==', propertyId))

    const snapshot = await getDocs(q)
    const payments = snapshot.docs.map(doc => doc.data())
    const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    result.push({
      month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      collected,
    })
  }

  return result
}
