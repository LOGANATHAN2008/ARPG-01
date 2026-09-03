import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Property, Building, Floor } from '@/types'

// ─────────────────────────────────────────────────────────
//  PROPERTIES
// ─────────────────────────────────────────────────────────

export async function getProperties(includeInactive = false): Promise<Property[]> {
  const propertiesRef = collection(db, 'properties')
  let q = query(propertiesRef)

  if (!includeInactive) {
    q = query(propertiesRef, where('status', '==', 'active'))
  }

  const snapshot = await getDocs(q)
  const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))
  
  // Sort in JS to avoid Firebase composite index requirement
  return properties.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function getProperty(id: string): Promise<Property> {
  const docRef = doc(db, 'properties', id)
  const snapshot = await getDoc(docRef)
  
  if (!snapshot.exists()) {
    throw new Error('Property not found')
  }
  
  const propertyData = { id: snapshot.id, ...snapshot.data() } as Property

  // Fetch counts manually
  try {
    const buildingsQuery = query(collection(db, 'buildings'), where('property_id', '==', id))
    const buildingsSnapshot = await getCountFromServer(buildingsQuery)
    const buildingsCount = buildingsSnapshot.data().count

    const floorsQuery = query(collection(db, 'floors'), where('property_id', '==', id))
    const floorsSnapshot = await getCountFromServer(floorsQuery)
    const floorsCount = floorsSnapshot.data().count

    const roomsQuery = query(collection(db, 'rooms'), where('property_id', '==', id), where('is_deleted', '==', false))
    const roomsSnapshot = await getDocs(roomsQuery)
    
    let total_beds = 0
    let available_beds = 0
    let occupied_beds = 0
    
    roomsSnapshot.forEach(roomDoc => {
      const room = roomDoc.data()
      total_beds += room.total_beds || 0
      available_beds += room.available_beds || 0
      occupied_beds += room.occupied_beds || 0
    })

    return {
      ...propertyData,
      buildings: [{ count: buildingsCount }],
      floors: [{ count: floorsCount }],
      rooms: [{ count: roomsSnapshot.size, total_beds, available_beds, occupied_beds }]
    } as any
  } catch (error) {
    console.error("Error fetching related stats for property:", error)
    return propertyData
  }
}

export async function createProperty(payload: Partial<Property>): Promise<Property> {
  const propertiesRef = doc(collection(db, 'properties'))
  const data = {
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  await setDoc(propertiesRef, data)
  return { id: propertiesRef.id, ...data } as Property
}

export async function updateProperty(id: string, payload: Partial<Property>): Promise<Property> {
  const docRef = doc(db, 'properties', id)
  const data = { ...payload, updated_at: new Date().toISOString() }
  await updateDoc(docRef, data)
  
  const updated = await getDoc(docRef)
  return { id: updated.id, ...updated.data() } as Property
}

export async function deleteProperty(id: string): Promise<void> {
  const docRef = doc(db, 'properties', id)
  await updateDoc(docRef, { status: 'inactive', updated_at: new Date().toISOString() })
}

// ─────────────────────────────────────────────────────────
//  BUILDINGS
// ─────────────────────────────────────────────────────────

export async function getBuildings(propertyId?: string): Promise<Building[]> {
  const buildingsRef = collection(db, 'buildings')
  let q = query(buildingsRef)
  
  if (propertyId) {
    q = query(buildingsRef, where('property_id', '==', propertyId))
  }
  
  const snapshot = await getDocs(q)
  const buildings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building))
  
  // Sort in JS to avoid Firebase composite index requirement
  buildings.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  
  // Stitch property data
  const propertyCache = new Map<string, any>()
  for (const b of buildings) {
    if (b.property_id && !propertyCache.has(b.property_id)) {
      const pDoc = await getDoc(doc(db, 'properties', b.property_id))
      if (pDoc.exists()) propertyCache.set(b.property_id, { name: pDoc.data().name, code: pDoc.data().code })
    }
    b.property = propertyCache.get(b.property_id)
  }
  
  return buildings
}

export async function createBuilding(payload: Partial<Building>): Promise<Building> {
  const docRef = doc(collection(db, 'buildings'))
  const data = { ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  await setDoc(docRef, data)
  return { id: docRef.id, ...data } as Building
}

export async function updateBuilding(id: string, payload: Partial<Building>): Promise<Building> {
  const docRef = doc(db, 'buildings', id)
  const data = { ...payload, updated_at: new Date().toISOString() }
  await updateDoc(docRef, data)
  const updated = await getDoc(docRef)
  return { id: updated.id, ...updated.data() } as Building
}

export async function deleteBuilding(id: string): Promise<void> {
  await deleteDoc(doc(db, 'buildings', id))
}

// ─────────────────────────────────────────────────────────
//  FLOORS
// ─────────────────────────────────────────────────────────

export async function getFloors(buildingId?: string, propertyId?: string): Promise<Floor[]> {
  const floorsRef = collection(db, 'floors')
  let q = query(floorsRef)
  
  if (buildingId && propertyId) {
    q = query(floorsRef, where('building_id', '==', buildingId), where('property_id', '==', propertyId))
  } else if (buildingId) {
    q = query(floorsRef, where('building_id', '==', buildingId))
  } else if (propertyId) {
    q = query(floorsRef, where('property_id', '==', propertyId))
  }
  
  const snapshot = await getDocs(q)
  const floors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Floor))
  
  // Sort in JS to avoid Firebase composite index requirement
  floors.sort((a, b) => (a.floor_number || 0) - (b.floor_number || 0))
  
  // Stitch building & property
  const buildingCache = new Map<string, any>()
  const propertyCache = new Map<string, any>()
  
  for (const f of floors) {
    if (f.building_id && !buildingCache.has(f.building_id)) {
      const bDoc = await getDoc(doc(db, 'buildings', f.building_id))
      if (bDoc.exists()) buildingCache.set(f.building_id, { name: bDoc.data().name, code: bDoc.data().code })
    }
    if (f.property_id && !propertyCache.has(f.property_id)) {
      const pDoc = await getDoc(doc(db, 'properties', f.property_id))
      if (pDoc.exists()) propertyCache.set(f.property_id, { name: pDoc.data().name, code: pDoc.data().code })
    }
    f.building = buildingCache.get(f.building_id)
    f.property = propertyCache.get(f.property_id)
  }
  
  return floors
}

export async function createFloor(payload: Partial<Floor>): Promise<Floor> {
  const docRef = doc(collection(db, 'floors'))
  const data = { ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  await setDoc(docRef, data)
  return { id: docRef.id, ...data } as Floor
}

export async function updateFloor(id: string, payload: Partial<Floor>): Promise<Floor> {
  const docRef = doc(db, 'floors', id)
  const data = { ...payload, updated_at: new Date().toISOString() }
  await updateDoc(docRef, data)
  const updated = await getDoc(docRef)
  return { id: updated.id, ...updated.data() } as Floor
}

export async function deleteFloor(id: string): Promise<void> {
  await deleteDoc(doc(db, 'floors', id))
}

// ─────────────────────────────────────────────────────────
//  PROPERTY STATS (for dashboard)
// ─────────────────────────────────────────────────────────

export async function getPropertyOccupancyStats(propertyId: string) {
  const roomsRef = collection(db, 'rooms')
  const q = query(roomsRef, where('property_id', '==', propertyId), where('is_deleted', '==', false))
  const snapshot = await getDocs(q)
  
  const rooms = snapshot.docs.map(doc => doc.data())
  
  const stats = {
    total_rooms: rooms.length,
    available_rooms: rooms.filter((r) => r.status === 'available').length,
    full_rooms: rooms.filter((r) => r.status === 'full').length,
    partial_rooms: rooms.filter((r) => r.status === 'partially_occupied').length,
    maintenance_rooms: rooms.filter((r) => r.status === 'maintenance').length,
    total_beds: rooms.reduce((sum, r) => sum + (r.total_beds || 0), 0),
    available_beds: rooms.reduce((sum, r) => sum + (r.available_beds || 0), 0),
    occupied_beds: rooms.reduce((sum, r) => sum + (r.occupied_beds || 0), 0),
  }

  return {
    ...stats,
    occupancy_percent:
      stats.total_beds > 0
        ? Math.round((stats.occupied_beds / stats.total_beds) * 100)
        : 0,
  }
}
