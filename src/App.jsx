import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import RoleSelect from './pages/RoleSelect'
import CandidateInfo from './pages/CandidateInfo'
import Interview from './pages/Interview'
import Report from './pages/Report'

const PROTECTED_PATHS = ['/candidate-info', '/interview', '/report']

function RefreshGuard() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const isProtected = PROTECTED_PATHS.includes(location.pathname)
    // Use performance navigation API to detect actual refresh vs normal navigation
    const navEntries = performance.getEntriesByType('navigation')
    const isRefresh = navEntries.length > 0 && navEntries[0].type === 'reload'

    if (isProtected && isRefresh) {
      // Clear interview data on refresh
      localStorage.removeItem('cachedReport')
      navigate('/role-select', { replace: true })
    }
  }, [])

  return null
}

function LoginRegisterPage() {
  const [isActive, setIsActive] = useState(false)

  // If user is already logged in, go to role select
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      // Don't auto redirect - let user stay on login if they want
    }
  }, [])

  return (
    <div className={`container ${isActive ? 'active' : ''}`}>
      <Login onSwitchToRegister={() => setIsActive(true)} />
      <Register onSwitchToLogin={() => setIsActive(false)} />
      <div className="Toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Hello, Welcome</h1>
          <p>Don't have an account?</p>
          <button className="btn register-btn" onClick={() => setIsActive(true)}>Register</button>
        </div>
        <div className="toggle-panel toggle-right">
          <h1>Welcome Back!</h1>
          <p>Already have an account?</p>
          <button className="btn login-btn" onClick={() => setIsActive(false)}>Login</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <RefreshGuard />
      <Routes>
        <Route path="/" element={<LoginRegisterPage />} />
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/candidate-info" element={<CandidateInfo />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </>
  )
}

export default App 