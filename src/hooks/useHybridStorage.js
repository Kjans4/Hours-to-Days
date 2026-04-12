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
 *
 * ── How the race conditions are prevented ───────────────────────────────
 *
 * Problem A — "Firebase writes fire immediately on login":
 *   When the user logs in, `user` changes and React re-runs the save
 *   effect. If the async Firebase load hasn't finished yet, the save
 *   effect would fire with stale local data. `initialLoadDone` blocks
 *   this. But a ref-check alone isn't enough — see Problem C.
 *
 * Problem B — "Firebase overwrites local changes on login":
 *   After login, if the user made changes while offline, Firebase's
 *   getDoc would overwrite them. We compare savedAt timestamps and only
 *   load from Firebase if it is strictly newer than local.
 *
 * Problem C — "localSavedAt gets stomped before the timestamp compare":
 *   When setValue(firebaseValue) fires inside loadFromFirebase, React
 *   schedules a re-render. The localStorage save effect then runs and
 *   stamps localSavedAt.current = Date.now() — a brand new time —
 *   BEFORE the timestamp comparison on the next render. We prevent this
 *   by using a separate `isLoadingFromFirebase` ref that tells the
 *   localStorage effect to skip stamping during a Firebase-driven load.
 *
 * Problem D — "save effect doesn't re-run after load completes":
 *   If local data was newer than Firebase and we kept it, we need the
 *   save effect to push it up. But since neither `value` nor `user`
 *   changed, the save effect won't re-run on its own. We solve this
 *   with a `pendingPush` ref — the load logic sets it to true when
 *   local wins, and the save effect checks it to force a write.
 */

const STORAGE_KEY_PREFIX = 'hts_'

function readLocalEnvelope(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'value' in parsed) {
      return { value: parsed.value, savedAt: parsed.savedAt ?? 0 }
    }
    // Old format (no envelope) — treat savedAt as 0 so Firebase wins
    // on first login. Safe fallback for existing users.
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
    console.error('useHybridStorage: localStorage write error', error)
  }
}

export function useHybridStorage(key, defaultValue) {
  const { user } = useAuth()

  const [value, setValue] = useState(() => {
    const envelope = readLocalEnvelope(key)
    return envelope ? envelope.value : defaultValue
  })

  const [loading, setLoading] = useState(false)

  // ── Refs that coordinate the three effects ────────────────────────────

  // The savedAt of whatever is currently in `value`. Read once on mount
  // from the envelope, then updated by the localStorage save effect.
  const localSavedAt = useRef(readLocalEnvelope(key)?.savedAt ?? 0)

  // Blocks the Firebase save effect from firing before the initial cloud
  // read has completed (Problem A).
  const initialLoadDone = useRef(false)

  // Set to true by the localStorage effect while a Firebase-driven
  // setValue is in flight. Tells it to skip re-stamping localSavedAt
  // so the timestamp comparison in the load effect isn't poisoned
  // (Problem C).
  const isLoadingFromFirebase = useRef(false)

  // Set to true by the load effect when local data is newer than Firebase.
  // Tells the save effect to push even though value didn't change
  // (Problem D).
  const pendingPush = useRef(false)

  // ── Load from Firebase when user logs in ─────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      initialLoadDone.current = false
      pendingPush.current = false
      return
    }

    let cancelled = false

    const loadFromFirebase = async () => {
      setLoading(true)

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
            const firebaseTime = docSnap.data().updatedAt?.toMillis?.() ?? 0
            // Read localSavedAt.current NOW, before any setValue call
            // could trigger the localStorage effect and overwrite it.
            const localTime = localSavedAt.current

            if (firebaseTime > localTime) {
              // ✅ Cloud is newer — load it.
              // Flag the localStorage effect so it doesn't re-stamp
              // localSavedAt with Date.now() during this setValue call.
              isLoadingFromFirebase.current = true
              setValue(firebaseValue)
              // Update localSavedAt to the Firebase time so future
              // comparisons are accurate.
              localSavedAt.current = firebaseTime
              writeLocalEnvelope(key, firebaseValue, firebaseTime)
              // isLoadingFromFirebase is cleared by the localStorage
              // effect after it runs (see below).

            } else if (localTime > firebaseTime) {
              // ✅ Local is newer — keep local data as-is.
              // Mark pendingPush so the save effect knows to push
              // even though value hasn't changed (Problem D).
              pendingPush.current = true
              console.info(
                `useHybridStorage: local "${key}" is newer ` +
                `(local ${new Date(localTime).toISOString()} vs ` +
                `firebase ${new Date(firebaseTime).toISOString()}). ` +
                `Keeping local, will push to cloud.`
              )
            }
            // Same timestamp = already in sync.
          }
          // No doc in Firebase = local is the source of truth.
          // pendingPush will send it up once initialLoadDone flips.
          else {
            pendingPush.current = true
          }
        }
      } catch (error) {
        console.error('useHybridStorage: Firebase load error', error)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) {
          initialLoadDone.current = true
          setLoading(false)
        }
      }
    }

    loadFromFirebase()
    return () => { cancelled = true }
  }, [user, key])

  // ── Save to localStorage on every value change ────────────────────────
  useEffect(() => {
    // If this render was triggered by a Firebase-driven setValue,
    // skip re-stamping so the load effect's timestamp compare
    // isn't poisoned (Problem C).
    if (isLoadingFromFirebase.current) {
      isLoadingFromFirebase.current = false
      return
    }

    const savedAt = Date.now()
    localSavedAt.current = savedAt
    writeLocalEnvelope(key, value, savedAt)
  }, [key, value])

  // ── Save to Firebase (debounced 1 s) ──────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (!initialLoadDone.current && !pendingPush.current) return

    const saveToFirebase = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'data', key)
        await setDoc(docRef, {
          value,
          updatedAt: new Date()
        })
        pendingPush.current = false
      } catch (error) {
        console.error('useHybridStorage: Firebase save error', error)
      }
    }

    const timer = setTimeout(saveToFirebase, 1000)
    return () => clearTimeout(timer)
  }, [value, user, key])

  return [value, setValue, loading]
}