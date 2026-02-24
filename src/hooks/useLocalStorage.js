import { useState, useEffect } from 'react'

/**
 * Custom hook for localStorage with JSON support
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if nothing in storage
 */
export function useLocalStorage(key, defaultValue) {
  // Initialize state with value from localStorage or default
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error loading ${key} from localStorage:`, error)
      return defaultValue
    }
  })

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error saving ${key} to localStorage:`, error)
    }
  }, [key, value])

  return [value, setValue]
}