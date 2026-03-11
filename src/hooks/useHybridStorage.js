import { useState, useEffect } from 'react'
import { db } from '../utils/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'

export function useHybridStorage(key, defaultValue) {
  const { user } = useAuth()
  const [value, setValue] = useState(() => {
    // Initialize from localStorage
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

    const loadFromFirebase = async () => {
      setLoading(true)
      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const firebaseData = docSnap.data().value
          
          // Merge strategy: Firebase data takes priority
          setValue(firebaseData)
          
          // Also update localStorage
          window.localStorage.setItem(key, JSON.stringify(firebaseData))
        }
        // If no Firebase data, keep current value (from localStorage)
      } catch (error) {
        console.error('Error loading from Firebase:', error)
      }
      setLoading(false)
    }

    loadFromFirebase()
  }, [user, key])

  // Save to localStorage immediately
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, value])

  // Save to Firebase if user is logged in (debounced)
  useEffect(() => {
    if (!user || loading) return

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

    // Debounce: wait 1 second before saving
    const timer = setTimeout(saveToFirebase, 1000)
    return () => clearTimeout(timer)
  }, [value, user, key, loading])

  return [value, setValue, loading]
}