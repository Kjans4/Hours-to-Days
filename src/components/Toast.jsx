import { useEffect, useState } from 'react'

/**
 * Toast Component
 * Shows a brief notification that auto-dismisses after a set duration.
 * 
 * @param {string} message - Text to display
 * @param {string} type - 'success' | 'warning' (controls color)
 * @param {function} onDismiss - Called when toast finishes
 */
function Toast({ message, type = 'success', onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Start fade-out after 2s, fully dismiss after animation (2.3s)
    const fadeTimer = setTimeout(() => setVisible(false), 2000)
    const dismissTimer = setTimeout(() => onDismiss?.(), 2300)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-visible' : 'toast-hidden'}`}>
      <span className="toast-icon">
        {type === 'success' ? '✓' : '⚠️'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

/**
 * ToastContainer
 * Manages a stack of toasts. Import this into TimelineCalendar.
 * 
 * Usage:
 *   const { toasts, showToast } = useToast()
 *   <ToastContainer toasts={toasts} onDismiss={removeToast} />
 */
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

/**
 * useToast hook
 * Returns showToast(message, type) and the toasts array + remover.
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, showToast, removeToast }
}

export default Toast