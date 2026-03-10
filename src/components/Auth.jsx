import { useState } from 'react'
import { auth } from '../utils/firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'

function Auth({ user, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Sign up
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (error) {
      // Friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try signing in instead.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found. Try signing up instead.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Wrong password.')
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else {
        setError(error.message)
      }
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
    onClose()
  }

  if (user) {
    return (
      <div className="auth-modal" onClick={onClose}>
        <div className="auth-content" onClick={(e) => e.stopPropagation()}>
          <h3>Logged in</h3>
          <p className="user-email">{user.email}</p>
          <button onClick={handleLogout} className="logout-btn">Sign Out</button>
          <button onClick={onClose} className="cancel-btn">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isSignUp ? 'Create Account' : 'Sign In'}</h3>
        <p className="auth-subtitle">
          {isSignUp 
            ? 'Enter email and password to create account' 
            : 'Enter your credentials to continue'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError('')
          }} 
          className="toggle-mode-btn"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>

        <button onClick={onClose} className="cancel-btn">Cancel</button>
      </div>
    </div>
  )
}

export default Auth