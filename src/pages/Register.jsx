import { useState } from 'react'

const BACKEND_URL = 'http://localhost:4000'

function Register({ onSwitchToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (name.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (data.success) {
        alert('Registration successful! Please login.')
        onSwitchToLogin()
      } else {
        setError(data.message || 'Registration failed')
      }

    } catch (err) {
      setError('Server error. Please try again.')
    }
  }

  return (
    <div className="form-box register">
      <form onSubmit={handleSubmit}>
        <h1>Registration</h1>
        <div className="input-box">
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <i className="fa-solid fa-user"></i>
        </div>
        <div className="input-box">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="fa-solid fa-envelope"></i>
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
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn">Register</button>
        <p>or Login with social platforms</p>
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

export default Register   