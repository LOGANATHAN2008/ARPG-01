import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserProfile, UserRole } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: FirebaseUser | null
  profile: UserProfile | null
  role: UserRole | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isTenant: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null, profile?: UserProfile }>
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  setupRecaptcha: (containerId: string) => void
  sendPhoneOtp: (phoneNumber: string) => Promise<{ confirmationResult?: ConfirmationResult, error: string | null }>
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global RecaptchaVerifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const docRef = doc(db, 'profiles', userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<UserProfile, 'id'>
        setProfile({ id: docSnap.id, ...data } as UserProfile)
      } else {
        console.warn('Profile not found for this user.')
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.uid) await fetchProfile(user.uid)
  }, [user?.uid, fetchProfile])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<{ error: string | null, profile?: UserProfile }> => {
    try {
      const userCreds = await signInWithEmailAndPassword(auth, email, password)
      
      const docRef = doc(db, 'profiles', userCreds.user.uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<UserProfile, 'id'>
        const userProfile = { id: docSnap.id, ...data } as UserProfile
        setProfile(userProfile)
        
        await updateDoc(docRef, {
          last_login: new Date().toISOString()
        }).catch(err => {
          console.warn('Could not update last login', err)
        })
        
        return { error: null, profile: userProfile }
      } else {
        return { error: 'Your account exists, but no Admin/Tenant Profile was found in the Database! Please check the User UID.', profile: undefined }
      }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'Invalid email or password' }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, string>
  ): Promise<{ error: string | null }> => {
    try {
      const userCreds = await createUserWithEmailAndPassword(auth, email, password)
      
      const newProfile = {
        user_id: userCreds.user.uid,
        email,
        full_name: metadata?.full_name || 'Admin User',
        phone: metadata?.phone || '',
        role: 'super_admin', // Temporarily forcing super_admin for you!
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      await setDoc(doc(db, 'profiles', userCreds.user.uid), newProfile)

      return { error: null }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'An unexpected error occurred during registration' }
    }
  }

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const provider = new GoogleAuthProvider()
      const userCreds = await signInWithPopup(auth, provider)
      
      const docRef = doc(db, 'profiles', userCreds.user.uid)
      const docSnap = await getDoc(docRef)
        
      if (!docSnap.exists()) {
        const newProfile = {
          user_id: userCreds.user.uid,
          email: userCreds.user.email || '',
          full_name: userCreds.user.displayName || 'New User',
          phone: userCreds.user.phoneNumber || '',
          avatar_url: userCreds.user.photoURL || '',
          role: 'tenant', 
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await setDoc(docRef, newProfile)
      } else {
        await updateDoc(docRef, {
          last_login: new Date().toISOString()
        })
      }
      
      return { error: null }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'Google Sign-In failed' }
    }
  }

  const setupRecaptcha = (containerId: string) => {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      })
    }
  }

  const sendPhoneOtp = async (phoneNumber: string): Promise<{ confirmationResult?: ConfirmationResult, error: string | null }> => {
    try {
      if (!recaptchaVerifier) {
        return { error: 'reCAPTCHA not initialized' }
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      return { confirmationResult, error: null }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'Failed to send OTP' }
    }
  }

  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otp: string): Promise<{ error: string | null }> => {
    try {
      const userCreds = await confirmationResult.confirm(otp)
      
      const docRef = doc(db, 'profiles', userCreds.user.uid)
      const docSnap = await getDoc(docRef)
        
      if (!docSnap.exists()) {
        const newProfile = {
          user_id: userCreds.user.uid,
          email: '',
          full_name: 'New Phone User',
          phone: userCreds.user.phoneNumber || '',
          role: 'tenant',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await setDoc(docRef, newProfile)
      } else {
        await updateDoc(docRef, {
          last_login: new Date().toISOString()
        })
      }
      return { error: null }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'Invalid OTP' }
    }
  }

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { error: null }
    } catch (err: any) {
      console.error(err)
      return { error: err.message || 'Failed to send reset email' }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const role = profile?.role ?? null
  const isAdmin = ['super_admin', 'admin', 'manager', 'staff'].includes(role ?? '')
  const isSuperAdmin = role === 'super_admin'
  const isTenant = role === 'tenant'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isTenant,
        signIn,
        signUp,
        signInWithGoogle,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
