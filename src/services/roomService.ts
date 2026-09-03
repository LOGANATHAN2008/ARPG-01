import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Room, Bed, RoomStatus, BedStatus } from '@/types'

// ─────────────────────────────────────────────────────────
//  ROOMS
// ─────────────────────────────────────────────────────────

export interface RoomFilters {
  property_id?: string
  floor_id?: string
  building_id?: string
  status?: RoomStatus
  room_type?: string
  page?: number
  pageSize?: number
  search?: string
}

export async function getRooms(filters: RoomFilters = {}): Promise<Room[]> {
  const roomsRef = collection(db, 'rooms')
  let q = query(roomsRef)

  if (filters.property_id) q = query(q, where('property_id', '==', filters.property_id))
  if (filters.floor_id) q = query(q, where('floor_id', '==', filters.floor_id))
  if (filters.building_id) q = query(q, where('building_id', '==', filters.building_id))
  if (filters.status) q = query(q, where('status', '==', filters.status))
  if (filters.room_type) q = query(q, where('room_type', '==', filters.room_type))
  
  // Note: orderBy might require composite indexes in Firestore if combined with where() clauses
  // q = query(q, orderBy('room_number'))

  const snapshot = await getDocs(q)
  let rooms = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      total_beds: data.total_beds ?? data.capacity ?? 0,
      occupied_beds: data.occupied_beds ?? 0,
      available_beds: data.available_beds ?? (data.capacity ?? 0)
    } as Room
  }).filter(r => !r.is_deleted)

  // Manual search filter
  if (filters.search) {
    const term = filters.search.toLowerCase()
    rooms = rooms.filter(r => r.room_number?.toLowerCase().includes(term))
  }

  // Stitch relations
  const floorCache = new Map<string, any>()
  const buildingCache = new Map<string, any>()
  const propertyCache = new Map<string, any>()

  for (const r of rooms) {
    if (r.floor_id && !floorCache.has(r.floor_id)) {
      const docSnap = await getDoc(doc(db, 'floors', r.floor_id))
      if (docSnap.exists()) floorCache.set(r.floor_id, docSnap.data())
    }
    if (r.building_id && !buildingCache.has(r.building_id)) {
      const docSnap = await getDoc(doc(db, 'buildings', r.building_id))
      if (docSnap.exists()) buildingCache.set(r.building_id, docSnap.data())
    }
    if (r.property_id && !propertyCache.has(r.property_id)) {
      const docSnap = await getDoc(doc(db, 'properties', r.property_id))
      if (docSnap.exists()) propertyCache.set(r.property_id, docSnap.data())
    }

    r.floor = floorCache.get(r.floor_id)
    r.building = buildingCache.get(r.building_id)
    r.property = propertyCache.get(r.property_id)
  }

  // Sort in memory since composite indexes might be missing
  rooms.sort((a, b) => (a.room_number || '').localeCompare(b.room_number || ''))

  return rooms
}

export async function getRoom(id: string): Promise<Room> {
  const docRef = doc(db, 'rooms', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Room not found')
  }
  
  const room = { id: snapshot.id, ...snapshot.data() } as Room

  // Stitch relations
  if (room.floor_id) {
    const fSnap = await getDoc(doc(db, 'floors', room.floor_id))
    if (fSnap.exists()) room.floor = fSnap.data() as any
  }
  if (room.building_id) {
    const bSnap = await getDoc(doc(db, 'buildings', room.building_id))
    if (bSnap.exists()) room.building = bSnap.data() as any
  }
  if (room.property_id) {
    const pSnap = await getDoc(doc(db, 'properties', room.property_id))
    if (pSnap.exists()) room.property = pSnap.data() as any
  }

  // Stitch beds
  const bedsQuery = query(collection(db, 'beds'), where('room_id', '==', id))
  const bedsSnap = await getDocs(bedsQuery)
  room.beds = bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed))

  // Stitch tenants into beds
  for (const bed of room.beds) {
    if (bed.current_tenant_id) {
      const tSnap = await getDoc(doc(db, 'tenants', bed.current_tenant_id))
      if (tSnap.exists()) {
        bed.current_tenant = { id: tSnap.id, ...tSnap.data() } as any
      }
    }
  }

  return room
}

export async function createRoom(payload: Partial<Room>): Promise<Room> {
  const batch = writeBatch(db)
  const roomRef = doc(collection(db, 'rooms'))
  
  const capacity = payload.capacity || 0
  const roomData = { 
    ...payload, 
    total_beds: payload.total_beds ?? capacity,
    available_beds: payload.available_beds ?? capacity,
    occupied_beds: payload.occupied_beds ?? 0,
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
  }
  
  batch.set(roomRef, roomData)

  // Automatically generate beds for the room
  for (let i = 0; i < capacity; i++) {
    const bedRef = doc(collection(db, 'beds'))
    const bedData: Partial<Bed> = {
      room_id: roomRef.id,
      floor_id: payload.floor_id || '',
      building_id: payload.building_id || '',
      property_id: payload.property_id || '',
      bed_label: String.fromCharCode(65 + i), // A, B, C...
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    batch.set(bedRef, bedData)
  }

  await batch.commit()
  return { id: roomRef.id, ...roomData } as Room
}

export async function updateRoom(id: string, payload: Partial<Room>): Promise<Room> {
  const docRef = doc(db, 'rooms', id)
  const data = { ...payload, updated_at: new Date().toISOString() }
  await updateDoc(docRef, data)
  
  const updated = await getDoc(docRef)
  return { id: updated.id, ...updated.data() } as Room
}

export async function deleteRoom(id: string): Promise<void> {
  const docRef = doc(db, 'rooms', id)
  await updateDoc(docRef, { is_deleted: true, updated_at: new Date().toISOString() })
}

export async function getFloorRoomVisualization(floorId: string) {
  const roomsRef = collection(db, 'rooms')
  const q = query(roomsRef, where('floor_id', '==', floorId))
  const snapshot = await getDocs(q)
  
  let rooms = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      total_beds: data.total_beds ?? data.capacity ?? 0,
      occupied_beds: data.occupied_beds ?? 0,
      available_beds: data.available_beds ?? (data.capacity ?? 0)
    } as Room
  }).filter(r => !r.is_deleted)

  // Stitch beds for visualization
  for (const r of rooms) {
    const bedsQuery = query(collection(db, 'beds'), where('room_id', '==', r.id))
    const bedsSnap = await getDocs(bedsQuery)
    r.beds = bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed))

    for (const bed of r.beds) {
      if (bed.current_tenant_id) {
        const tSnap = await getDoc(doc(db, 'tenants', bed.current_tenant_id))
        if (tSnap.exists()) {
          bed.current_tenant = { id: tSnap.id, ...tSnap.data() } as any
        }
      }
    }
  }

  rooms.sort((a, b) => (a.room_number || '').localeCompare(b.room_number || ''))
  return rooms
}

// ─────────────────────────────────────────────────────────
//  BEDS
// ─────────────────────────────────────────────────────────

export async function getBeds(roomId: string): Promise<Bed[]> {
  const bedsRef = collection(db, 'beds')
  const q = query(bedsRef, where('room_id', '==', roomId))
  const snapshot = await getDocs(q)
  
  const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed))

  for (const bed of beds) {
    if (bed.current_tenant_id) {
      const tSnap = await getDoc(doc(db, 'tenants', bed.current_tenant_id))
      if (tSnap.exists()) {
        bed.current_tenant = { id: tSnap.id, ...tSnap.data() } as any
      }
    }
  }
  
  beds.sort((a, b) => (a.bed_label || '').localeCompare(b.bed_label || ''))
  return beds
}

export async function createBed(payload: Partial<Bed>): Promise<Bed> {
  const docRef = doc(collection(db, 'beds'))
  const data = { ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  await setDoc(docRef, data)
  return { id: docRef.id, ...data } as Bed
}

export async function updateBed(id: string, payload: Partial<Bed>): Promise<Bed> {
  const docRef = doc(db, 'beds', id)
  const data = { ...payload, updated_at: new Date().toISOString() }
  await updateDoc(docRef, data)
  const updated = await getDoc(docRef)
  return { id: updated.id, ...updated.data() } as Bed
}

export async function updateBedStatus(id: string, status: BedStatus): Promise<void> {
  const docRef = doc(db, 'beds', id)
  await updateDoc(docRef, { status, updated_at: new Date().toISOString() })
}

export async function assignBed(bedId: string, tenantId: string): Promise<void> {
  const docRef = doc(db, 'beds', bedId)
  await updateDoc(docRef, { status: 'occupied', current_tenant_id: tenantId, updated_at: new Date().toISOString() })

  const bedSnap = await getDoc(docRef)
  if (bedSnap.exists()) {
    const bed = bedSnap.data() as Bed
    const tenantRef = doc(db, 'tenants', tenantId)
    await updateDoc(tenantRef, {
      bed_id: bedId,
      room_id: bed.room_id,
      floor_id: bed.floor_id,
      building_id: bed.building_id,
      property_id: bed.property_id,
      updated_at: new Date().toISOString()
    })
  }
}

export async function vacateBed(bedId: string): Promise<void> {
  const docRef = doc(db, 'beds', bedId)
  await updateDoc(docRef, { status: 'available', current_tenant_id: null, updated_at: new Date().toISOString() })
}

export async function getAvailableBeds(propertyId?: string): Promise<Bed[]> {
  const bedsRef = collection(db, 'beds')
  let q = query(bedsRef, where('status', '==', 'available'))
  if (propertyId) {
    q = query(q, where('property_id', '==', propertyId))
  }
  
  const snapshot = await getDocs(q)
  const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed))

  // Stitch room details
  for (const bed of beds) {
    if (bed.room_id) {
      const rSnap = await getDoc(doc(db, 'rooms', bed.room_id))
      if (rSnap.exists()) {
        const room = rSnap.data()
        
        if (room.floor_id) {
          const fSnap = await getDoc(doc(db, 'floors', room.floor_id))
          if (fSnap.exists()) {
            room.floor = fSnap.data()
          }
        }
        bed.room = room as any
      }
    }
  }

  return beds
}
