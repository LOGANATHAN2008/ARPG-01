import { collection, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Announcement } from '@/types'

export async function createAnnouncement(payload: Partial<Announcement>): Promise<Announcement> {
  const announcementsRef = collection(db, 'announcements')
  const newDocRef = doc(announcementsRef)
  
  const data = {
    ...payload,
    is_active: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  await setDoc(newDocRef, data)
  
  return { id: newDocRef.id, ...data } as Announcement
}
