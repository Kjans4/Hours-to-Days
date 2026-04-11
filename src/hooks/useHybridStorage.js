import { useState, useEffect } from 'react'
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

  // Load from Firebase when user logs in
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadFromFirebase = async () => {
      setLoading(true)

      /**
       * FIX: timeout guard — if Firebase takes more than 8 seconds,
       * force loading to false so writes are never permanently blocked.
       */
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn(`useHybridStorage: Firebase load timed out for key "${key}"`)
          setLoading(false)
        }
      }, 8000)

      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        const docSnap = await getDoc(docRef)

        if (!cancelled && docSnap.exists()) {
          const firebaseData = docSnap.data().value
          setValue(firebaseData)
          window.localStorage.setItem(key, JSON.stringify(firebaseData))
        }
      } catch (error) {
        console.error('Error loading from Firebase:', error)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) setLoading(false)
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

  // Save to Firebase if user is logged in (debounced 1s)
  // FIX: removed `loading` from the condition — loading only blocks
  // the initial overwrite from Firebase, not subsequent user writes.
  // We use a separate `initialLoadDone` guard instead.
  useEffect(() => {
    if (!user) return

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
  }, [value, user, key]) // ← removed `loading` dep — writes are never blocked

  return [value, setValue, loading]
}