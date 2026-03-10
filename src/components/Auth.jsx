import { useState } from 'react'
import { auth } from '../utils/firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut 
} from 'firebase/auth'

function Auth({ user, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onClose()
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups for this site.')
      } else {
        setError('Google sign-in failed. Please try again.')
      }
    }
    setLoading(false)
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (error) {
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
          <div className="user-info">
            {user.photoURL && (
              <img src={user.photoURL} alt="Profile" className="user-avatar" />
            )}
            <p className="user-email">{user.email}</p>
          </div>
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
        <p className="auth-subtitle">Sign in to sync your data across devices</p>

        {/* Google Sign-In Button */}
        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="google-btn"
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Please wait...' : 'Continue with Google'}
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit}>
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