import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = 'http://localhost:4000'

function Login({ onSwitchToRegister }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('userId', data.userId)
        navigate('/role-select')
      } else {
        setError(data.message || 'Login failed')
      }

    } catch (err) {
      setError('Server error. Please try again.')
    }
  }

  return (
    <div className="form-box login">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <div className="input-box">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="fa-solid fa-user"></i>
        </div>
        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="fa-solid fa-lock"></i>
        </div>
        <div className="forgot-link">
          <a href="#">Forgot Password?</a>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn">Login</button>
        <p>or login with social platforms</p>
        <div className="social-icons">
          <a href="#"><i className="fa-brands fa-google"></i></a>
          <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#"><i className="fa-brands fa-github"></i></a>
          <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
        </div>
      </form>
    </div>
  )
}

export default Login
 