import { useState, useEffect } from 'react'
import { auth } from '../utils/firebase'
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth'

function Auth({ user, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true
    }

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', email)
      setSent(true)
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
    onClose()
  }

  // Check if returning from email link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        email = window.prompt('Please provide your email for confirmation')
      }

      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn')
        })
        .catch((error) => {
          console.error('Error signing in:', error)
        })
    }
  }, [])

  if (user) {
    return (
      <div className="auth-modal" onClick={onClose}>
        <div className="auth-content" onClick={(e) => e.stopPropagation()}>
          <h3>Logged in</h3>
          <p>{user.email}</p>
          <button onClick={handleLogout}>Sign Out</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="auth-modal" onClick={onClose}>
        <div className="auth-content" onClick={(e) => e.stopPropagation()}>
          <h3>Check your email!</h3>
          <p>We sent a magic link to <strong>{email}</strong></p>
          <p className="note">Click the link to sign in</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <h3>Sign in to sync your data</h3>
        <p>Enter your email to receive a magic link</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        <button onClick={onClose} className="cancel-btn">Cancel</button>
      </div>
    </div>
  )
}

export default Auth