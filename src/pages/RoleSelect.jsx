import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RoleSelect.css'

const BACKEND_URL = 'http://localhost:4000'

const roles = [
  { id: 'frontend', title: 'Frontend Developer', icon: '🖥️', desc: 'React, Vue, CSS, HTML' },
  { id: 'backend', title: 'Backend Developer', icon: '🔧', desc: 'Node, APIs, Databases' },
  { id: 'fullstack', title: 'Full Stack Developer', icon: '🔧', desc: 'End-to-end development' },
  { id: 'webdev', title: 'Web Developer', icon: '🌐', desc: 'HTML, CSS, JavaScript' },
  { id: 'mobile', title: 'Mobile App Developer', icon: '📱', desc: 'React Native, Flutter' },
  { id: 'datascience', title: 'Data Scientist', icon: '📊', desc: 'Python, ML, Statistics' },
  { id: 'dataanalyst', title: 'Data Analyst', icon: '📈', desc: 'SQL, Excel, Power BI, Tableau' },
  { id: 'ml', title: 'ML Engineer', icon: '🧠', desc: 'Deep Learning, NLP, Computer Vision' },
  { id: 'prompt', title: 'Prompt Engineer', icon: '✨', desc: 'LLMs, GPT, AI Tools' },
  { id: 'devops', title: 'DevOps Engineer', icon: '⚙️', desc: 'CI/CD, Docker, Kubernetes' },
  { id: 'cloud', title: 'Cloud Architect', icon: '☁️', desc: 'AWS, Azure, GCP' },
  { id: 'uiux', title: 'UI/UX Designer', icon: '🎨', desc: 'Figma, Wireframes, UX Research' },
  { id: 'graphic', title: 'Graphic Designer', icon: '🖌️', desc: 'Photoshop, Illustrator, Branding' },
  { id: 'pm', title: 'Product Manager', icon: '📋', desc: 'Roadmaps, Agile, Strategy' },
  { id: 'security', title: 'Cybersecurity Analyst', icon: '🛡️', desc: 'Threat Analysis, SOC, SIEM' },
  { id: 'ethical', title: 'Ethical Hacker', icon: '🕵️', desc: 'Penetration Testing, Bug Bounty' },
  { id: 'engineering-manager', title: 'Engineering Manager', icon: '👥', desc: 'Team Leadership, Planning' },
  { id: 'scrum', title: 'Scrum Master', icon: '🔄', desc: 'Agile, Sprints, Retrospectives' },
  { id: 'sysadmin', title: 'System Administrator', icon: '🖥️', desc: 'Linux, Windows Server, Networking' },
  { id: 'qa', title: 'QA Engineer', icon: '🌐', desc: 'Testing, Automation, Selenium' },
]

function RoleSelect() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)
    setError('')

    const userId = localStorage.getItem('userId')

    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/start-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: selected.title })
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('interviewId', data.interviewId)
        localStorage.setItem('interviewRole', selected.title)
        navigate('/candidate-info')
      } else {
        setError(data.message || 'Failed to start interview')
      }
    } catch (err) {
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="role-page">
      <div className="role-header">
        <h1>Choose Your Role</h1>
        <p>Select the position you would like to be interviewed for</p>
      </div>

      <div className="role-grid">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`role-card ${selected?.id === role.id ? 'selected' : ''}`}
            onClick={() => setSelected(role)}
          >
            <span className="role-icon">{role.icon}</span>
            <h3>{role.title}</h3>
            <p>{role.desc}</p>
            {selected?.id === role.id && <span className="check">✔</span>}
          </div>
        ))}
      </div>

      {error && <p className="role-error">{error}</p>}

      <button
        className={`start-btn ${!selected ? 'disabled' : ''}`}
        onClick={handleStart}
        disabled={!selected || loading}
      >
        {loading ? 'Starting...' : 'Next: Your Profile →'}
      </button>
    </div>
  )
}

export default RoleSelect 