import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, writeBatch, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Notification, NotificationType } from '@/types'

export async function getNotifications(userId: string, queryLimit = 50): Promise<Notification[]> {
  const notificationsRef = collection(db, 'notifications')
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(queryLimit)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
}

export async function getUnreadCount(userId: string): Promise<number> {
  const notificationsRef = collection(db, 'notifications')
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    where('is_read', '==', false)
  )

  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

export async function markAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, 'notifications', notificationId)
  await updateDoc(docRef, { is_read: true, read_at: new Date().toISOString() })
}

export async function markAllAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'notifications')
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    where('is_read', '==', false)
  )

  const snapshot = await getDocs(q)
  const batch = writeBatch(db)

  snapshot.forEach(docSnap => {
    batch.update(docSnap.ref, { is_read: true, read_at: new Date().toISOString() })
  })

  await batch.commit()
}

export async function createNotification(params: {
  user_id: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, string>
  action_url?: string
}): Promise<void> {
  const docRef = doc(collection(db, 'notifications'))
  await setDoc(docRef, {
    ...params,
    is_read: false,
    created_at: new Date().toISOString()
  })
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', id))
}

// ─────────────────────────────────────────────────────────
//  REALTIME (onSnapshot)
// ─────────────────────────────────────────────────────────

export function subscribeToNotifications(
  userId: string,
  onNew: (notification: Notification) => void
) {
  const notificationsRef = collection(db, 'notifications')
  const q = query(notificationsRef, where('user_id', '==', userId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const notif = { id: change.doc.id, ...change.doc.data() } as Notification
        // Since we fetch initial data, we only want newly added ones after initial load. 
        // For simplicity, we just pass all added docs. The UI should deduplicate by ID.
        onNew(notif)
      }
    })
  })

  return { unsubscribe }
}

export function subscribeToComplaints(
  propertyId: string,
  onChange: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  const complaintsRef = collection(db, 'complaints')
  const q = query(complaintsRef, where('property_id', '==', propertyId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
        const docData = { id: change.doc.id, ...change.doc.data() }
        onChange({
          eventType: change.type.toUpperCase(),
          new: docData,
          old: {}
        })
      }
    })
  })

  return { unsubscribe }
}

export function subscribeToPayments(
  propertyId: string,
  onInsert: (payload: Record<string, unknown>) => void
) {
  const paymentsRef = collection(db, 'payments')
  const q = query(paymentsRef, where('property_id', '==', propertyId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        onInsert({ id: change.doc.id, ...change.doc.data() })
      }
    })
  })

  return { unsubscribe }
}

export function subscribeToInvoice(
  invoiceId: string,
  onChange: (invoice: Record<string, unknown>) => void
) {
  const docRef = doc(db, 'invoices', invoiceId)
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onChange({ id: docSnap.id, ...docSnap.data() })
    }
  })

  return { unsubscribe }
}

export function subscribeToComplaint(
  complaintId: string,
  onChange: (data: Record<string, unknown>) => void
) {
  const docRef = doc(db, 'complaints', complaintId)
  
  const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onChange({ id: docSnap.id, ...docSnap.data(), _type: 'complaint' })
    }
  })

  const activityRef = collection(db, 'complaint_activity')
  const q = query(activityRef, where('complaint_id', '==', complaintId))

  const unsubscribeActivity = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onChange({ id: change.doc.id, ...change.doc.data(), _type: 'activity' })
      }
    })
  })

  return { 
    unsubscribe: () => {
      unsubscribeDoc()
      unsubscribeActivity()
    }
  }
}
