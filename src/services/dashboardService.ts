import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DashboardStats } from '@/types'

export async function getDashboardStats(propertyId?: string): Promise<DashboardStats> {
  const propertiesRef = collection(db, 'properties')
  const roomsRef = collection(db, 'rooms')
  const bedsRef = collection(db, 'beds')
  const tenantsRef = collection(db, 'tenants')
  const invoicesRef = collection(db, 'invoices')
  const complaintsRef = collection(db, 'complaints')
  const paymentsRef = collection(db, 'payments')
  const enquiriesRef = collection(db, 'enquiries')

  // Build queries
  let pQuery = query(propertiesRef, where('status', '==', 'active'))
  
  let rQuery = query(roomsRef, where('is_deleted', '==', false))
  if (propertyId) rQuery = query(rQuery, where('property_id', '==', propertyId))
  
  let bQuery = propertyId ? query(bedsRef, where('property_id', '==', propertyId)) : bedsRef
  
  let tQuery = query(tenantsRef, where('is_deleted', '==', false))
  if (propertyId) tQuery = query(tQuery, where('property_id', '==', propertyId))
  
  let iQuery = query(invoicesRef, where('is_deleted', '==', false))
  if (propertyId) iQuery = query(iQuery, where('property_id', '==', propertyId))
  
  let cQuery = query(complaintsRef, where('is_deleted', '==', false))
  if (propertyId) cQuery = query(cQuery, where('property_id', '==', propertyId))

  const today = new Date().toISOString().split('T')[0]
  let todayPQuery = query(paymentsRef, where('paid_at', '>=', today))
  if (propertyId) todayPQuery = query(todayPQuery, where('property_id', '==', propertyId))

  let eqQuery = query(enquiriesRef, where('status', '==', 'new'))

  try {
    // Execute in parallel
    const [
      propertiesCountSnap,
      roomsSnap,
      bedsCountSnap,
      tenantsSnap,
      invoicesSnap,
      complaintsSnap,
      todayPaymentsSnap,
      enquiriesCountSnap
    ] = await Promise.all([
      propertyId ? Promise.resolve({ data: { count: 1 } }) : getCountFromServer(pQuery),
      getDocs(rQuery),
      getCountFromServer(bQuery),
      getDocs(tQuery),
      getDocs(iQuery),
      getDocs(cQuery),
      getDocs(todayPQuery),
      getCountFromServer(eqQuery)
    ])

    // Properties
    const totalProperties = typeof propertiesCountSnap.data === 'function' ? propertiesCountSnap.data().count : (propertiesCountSnap.data as any).count

    // Rooms
    const rooms = roomsSnap.docs.map(d => d.data())
    const totalRooms = rooms.length
    const totalBeds = rooms.reduce((sum: number, r: any) => sum + (r.total_beds || 0), 0)
    const occupiedBeds = rooms.reduce((sum: number, r: any) => sum + (r.occupied_beds || 0), 0)
    const availableBeds = rooms.reduce((sum: number, r: any) => sum + (r.available_beds || 0), 0)

    // Tenants
    const tenants = tenantsSnap.docs.map(d => d.data())
    const totalTenants = tenants.length
    const activeTenants = tenants.filter((t: any) => t.status === 'active').length
    const pendingTenants = tenants.filter((t: any) => t.status === 'pending_verification').length
    const noticeTenants = tenants.filter((t: any) => t.status === 'notice_period').length

    // Invoices
    const invoices = invoicesSnap.docs.map(d => d.data())
    const monthlyExpected = invoices.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0)
    const monthlyCollected = invoices.reduce((sum: number, i: any) => sum + Number(i.paid_amount || 0), 0)
    const monthlyPending = invoices
      .filter((i: any) => ['pending', 'partially_paid'].includes(i.status))
      .reduce((sum: number, i: any) => sum + Number(i.balance_due || 0), 0)
    const monthlyOverdue = invoices
      .filter((i: any) => i.status === 'overdue')
      .reduce((sum: number, i: any) => sum + Number(i.balance_due || 0), 0)
    
    const pendingInvoices = invoices.filter((i: any) => ['pending', 'partially_paid'].includes(i.status)).length
    const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue').length

    // Complaints
    const complaints = complaintsSnap.docs.map(d => d.data())
    const openStatuses = ['submitted', 'acknowledged', 'assigned', 'in_progress', 'waiting_for_parts', 'reopened']
    const openComplaints = complaints.filter((c: any) => openStatuses.includes(c.status)).length
    const highPriority = complaints.filter((c: any) => ['high', 'critical'].includes(c.priority)).length
    const inProgress = complaints.filter((c: any) => c.status === 'in_progress').length

    // Payments
    const todayPaymentsRaw = todayPaymentsSnap.docs.map(d => d.data())
    const todayPayments = todayPaymentsRaw.filter((p: any) => ['success', 'manually_verified'].includes(p.status))
    const todayRevenue = todayPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

    // Enquiries
    const newEnquiries = typeof enquiriesCountSnap.data === 'function' ? enquiriesCountSnap.data().count : (enquiriesCountSnap.data as any).count

    return {
      total_properties: totalProperties,
      total_buildings: 0,
      total_floors: 0,
      total_rooms: totalRooms,
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      reserved_beds: 0,
      maintenance_beds: 0,
      occupancy_percent: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      total_tenants: totalTenants,
      active_tenants: activeTenants,
      pending_tenants: pendingTenants,
      notice_period_tenants: noticeTenants,
      monthly_expected_revenue: monthlyExpected,
      monthly_collected_revenue: monthlyCollected,
      monthly_pending_revenue: monthlyPending,
      monthly_overdue_revenue: monthlyOverdue,
      today_revenue: todayRevenue,
      open_complaints: openComplaints,
      high_priority_complaints: highPriority,
      in_progress_complaints: inProgress,
      resolved_today: 0,
      pending_invoices: pendingInvoices,
      overdue_invoices: overdueInvoices,
      new_enquiries: newEnquiries || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      total_properties: 0, total_buildings: 0, total_floors: 0, total_rooms: 0,
      total_beds: 0, occupied_beds: 0, available_beds: 0, reserved_beds: 0,
      maintenance_beds: 0, occupancy_percent: 0, total_tenants: 0, active_tenants: 0,
      pending_tenants: 0, notice_period_tenants: 0, monthly_expected_revenue: 0,
      monthly_collected_revenue: 0, monthly_pending_revenue: 0, monthly_overdue_revenue: 0,
      today_revenue: 0, open_complaints: 0, high_priority_complaints: 0,
      in_progress_complaints: 0, resolved_today: 0, pending_invoices: 0,
      overdue_invoices: 0, new_enquiries: 0,
    }
  }
}
