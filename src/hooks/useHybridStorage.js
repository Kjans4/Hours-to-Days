import { useState, useEffect, useRef } from 'react'
import { db } from '../utils/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'

/**
 * useHybridStorage
 *
 * Stores data in localStorage (instant, offline-first) and syncs to
 * Firebase when the user is logged in.
 *
 * localStorage envelope format:
 *   { value: <actual data>, savedAt: <unix ms timestamp> }
 *
 * This envelope lets us compare local vs Firebase timestamps on login
 * so we never silently overwrite newer local work with older cloud data.
 */

const STORAGE_KEY_PREFIX = 'hts_'

function readLocalEnvelope(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Must have the envelope shape. Pre-fix plain values are treated as
    // savedAt = 0 so Firebase wins on first login — safe fallback for
    // existing users upgrading from the old format.
    if (parsed && typeof parsed === 'object' && 'value' in parsed) {
      return { value: parsed.value, savedAt: parsed.savedAt ?? 0 }
    }
    return null
  } catch {
    return null
  }
}

function writeLocalEnvelope(key, value, savedAt = Date.now()) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY_PREFIX + key,
      JSON.stringify({ value, savedAt })
    )
  } catch (error) {
    console.error('useHybridStorage: error writing to localStorage', error)
  }
}

export function useHybridStorage(key, defaultValue) {
  const { user } = useAuth()

  const [value, setValue] = useState(() => {
    const envelope = readLocalEnvelope(key)
    return envelope ? envelope.value : defaultValue
  })

  const [loading, setLoading] = useState(false)

  // Guards the save-to-Firebase effect from firing before the initial
  // Firebase load has completed. Without this, stale local data races
  // the cloud read and can overwrite newer Firebase data.
  const initialLoadDone = useRef(false)

  // Tracks the savedAt timestamp of whatever is currently in `value`
  // so we can write it accurately to the local envelope on every change.
  const localSavedAt = useRef(readLocalEnvelope(key)?.savedAt ?? 0)

  // ── Load from Firebase when user logs in ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      // Reset guard on logout so next login does a fresh load
      initialLoadDone.current = false
      return
    }

    let cancelled = false

    const loadFromFirebase = async () => {
      setLoading(true)

      // Safety timeout — if Firebase hangs, unblock writes after 8 s
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn(`useHybridStorage: load timed out for "${key}"`)
          initialLoadDone.current = true
          setLoading(false)
        }
      }, 8000)

      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        const docSnap = await getDoc(docRef)

        if (!cancelled) {
          if (docSnap.exists()) {
            const firebaseValue = docSnap.data().value
            // Firestore stores updatedAt as a Timestamp object.
            // .toMillis() converts to unix ms for a fair comparison.
            const firebaseTime = docSnap.data().updatedAt?.toMillis?.() ?? 0
            const localTime = localSavedAt.current

            if (firebaseTime > localTime) {
              // Cloud is newer — load it and stamp local envelope
              setValue(firebaseValue)
              localSavedAt.current = firebaseTime
              writeLocalEnvelope(key, firebaseValue, firebaseTime)

            } else if (localTime > firebaseTime) {
              // Local is newer — keep local state as-is.
              // Once initialLoadDone flips below, the save effect will
              // push the local data up to Firebase automatically.
              console.info(
                `useHybridStorage: local "${key}" is newer than Firebase ` +
                `(local ${new Date(localTime).toISOString()} vs ` +
                `firebase ${new Date(firebaseTime).toISOString()}). ` +
                `Keeping local, pushing to cloud.`
              )
            }
            // Equal timestamps = already in sync, nothing to do.
          }
          // No Firebase doc yet = local is the source of truth.
          // Save effect will push it up once initialLoadDone flips.
        }
      } catch (error) {
        console.error('useHybridStorage: error loading from Firebase', error)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) {
          // Flip initialLoadDone BEFORE clearing loading state so the
          // save effect can fire immediately if value changed above.
          initialLoadDone.current = true
          setLoading(false)
        }
      }
    }

    loadFromFirebase()
    return () => { cancelled = true }
  }, [user, key])

  // ── Save to localStorage on every value change ─────────────────────────
  // Stamps each save with the current time so we can compare with Firebase.
  useEffect(() => {
    const savedAt = Date.now()
    localSavedAt.current = savedAt
    writeLocalEnvelope(key, value, savedAt)
  }, [key, value])

  // ── Save to Firebase (debounced 1 s) ───────────────────────────────────
  // The initialLoadDone guard ensures this never fires during the initial
  // cloud read, preventing stale local data from racing to Firestore.
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
        console.error('useHybridStorage: error saving to Firebase', error)
      }
    }

    const timer = setTimeout(saveToFirebase, 1000)
    return () => clearTimeout(timer)
  }, [value, user, key])

  return [value, setValue, loading]
}