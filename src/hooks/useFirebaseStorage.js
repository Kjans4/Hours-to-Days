import { useState, useEffect } from 'react'
import { db } from '../utils/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'

export function useFirebaseStorage(key, defaultValue) {
  const { user } = useAuth()
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  // Load from Firebase
  useEffect(() => {
    if (!user) {
      setValue(defaultValue)
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setValue(docSnap.data().value)
        } else {
          setValue(defaultValue)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setValue(defaultValue)
      }
      setLoading(false)
    }

    loadData()
  }, [user, key])

  // Save to Firebase
  useEffect(() => {
    if (!user || loading) return

    const saveData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        await setDoc(docRef, {
          value,
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Error saving data:', error)
      }
    }

    saveData()
  }, [value, user, key, loading])

  return [value, setValue, loading]
}