import { useState, useEffect, useRef } from 'react'
import { db } from '../utils/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'

export function useHybridStorage(key, defaultValue) {
  const { user } = useAuth()
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return defaultValue
    }
  })
  const [loading, setLoading] = useState(false)

  // FIX #2: Guard that prevents the save effect from firing during the
  // initial Firebase load. Without this, stale localStorage data gets
  // written back to Firestore before the cloud data has been read.
  const initialLoadDone = useRef(false)

  // Load from Firebase when user logs in
  useEffect(() => {
    if (!user) {
      setLoading(false)
      // Reset guard when user logs out so next login loads fresh
      initialLoadDone.current = false
      return
    }

    let cancelled = false

    const loadFromFirebase = async () => {
      setLoading(true)

      // Timeout guard — if Firebase takes more than 8 seconds,
      // unblock writes so the app doesn't stay frozen.
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn(`useHybridStorage: Firebase load timed out for key "${key}"`)
          initialLoadDone.current = true
          setLoading(false)
        }
      }, 8000)

      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        const docSnap = await getDoc(docRef)

        if (!cancelled && docSnap.exists()) {
          const firebaseData = docSnap.data().value

          // FIX #1: Only overwrite local data if Firebase is newer.
          // This prevents logging in from silently erasing offline work.
          const firebaseTime = docSnap.data().updatedAt?.toMillis?.() ?? 0
          const localRaw = window.localStorage.getItem(key)
          const localTime = localRaw
            ? (() => { try { return JSON.parse(localRaw)?._updatedAt ?? 0 } catch { return 0 } })()
            : 0

          if (firebaseTime >= localTime) {
            setValue(firebaseData)
            window.localStorage.setItem(key, JSON.stringify(firebaseData))
          }
          // else: local data is newer, keep it — Firebase will be updated
          // by the save effect once initialLoadDone is set to true below.
        }
      } catch (error) {
        console.error('Error loading from Firebase:', error)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) {
          // Mark load as done BEFORE releasing the save-effect gate
          initialLoadDone.current = true
          setLoading(false)
        }
      }
    }

    loadFromFirebase()

    return () => { cancelled = true }
  }, [user, key])

  // Save to localStorage immediately on every value change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, value])

  // Save to Firebase if user is logged in (debounced 1s).
  // FIX #2: initialLoadDone guard prevents this from firing during the
  // initial Firebase read, which would write stale local data to the cloud.
  useEffect(() => {
    if (!user) return
    if (!initialLoadDone.current) return

    const saveToFirebase = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        await setDoc(docRef, {
          value,
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Error saving to Firebase:', error)
      }
    }

    const timer = setTimeout(saveToFirebase, 1000)
    return () => clearTimeout(timer)
  }, [value, user, key])

  return [value, setValue, loading]
}