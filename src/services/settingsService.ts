import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface InvoiceSettings {
  upiId: string
  bankName: string
  accountNumber: string
  ifscCode: string
}

export const getInvoiceSettings = async (): Promise<InvoiceSettings | null> => {
  const docRef = doc(db, 'settings', 'invoice_settings')
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return docSnap.data() as InvoiceSettings
  }
  
  return null
}

export const updateInvoiceSettings = async (settings: Partial<InvoiceSettings>) => {
  const docRef = doc(db, 'settings', 'invoice_settings')
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    await updateDoc(docRef, settings)
  } else {
    await setDoc(docRef, settings)
  }
}
