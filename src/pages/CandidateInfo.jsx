import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CandidateInfo.css'

const experienceLevels = [
  { id: 'fresher', label: 'Fresher', desc: '0-1 years • Fresh graduate or student', icon: '🎓' },
  { id: 'junior', label: 'Junior', desc: '1-3 years • Some professional experience', icon: '🌱' },
  { id: 'mid', label: 'Mid-Level', desc: '3-5 years • Solid experience', icon: '💼' },
  { id: 'senior', label: 'Senior', desc: '5+ years • Extensive experience', icon: '🚀' },
]

// Master list of valid tech skills for dropdown suggestions
const ALL_SKILLS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind',
  'Bootstrap', 'Redux', 'Next.js', 'Gatsby', 'Webpack', 'Vite', 'Figma',
  'Node.js', 'Express', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
  'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'C++', 'C#', '.NET',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Cassandra', 'DynamoDB',
  'GraphQL', 'REST APIs', 'gRPC', 'WebSockets', 'JWT', 'OAuth',
  'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
  'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Pulumi', 'Helm',
  'Linux', 'Bash', 'PowerShell', 'Nginx', 'Apache',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
  'Tableau', 'Power BI', 'Excel', 'R', 'Jupyter', 'Spark', 'Hadoop',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android Studio', 'Xcode',
  'Firebase', 'Supabase', 'Prisma', 'Sequelize', 'Mongoose',
  'Selenium', 'Cypress', 'Jest', 'Mocha', 'Pytest', 'JUnit',
  'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'New Relic',
  'Photoshop', 'Illustrator', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin',
  'Agile', 'Scrum', 'Kanban', 'JIRA', 'Notion', 'Trello',
  'MLflow', 'Hugging Face', 'OpenAI API', 'LangChain', 'Pinecone',
  'Kafka', 'RabbitMQ', 'Celery', 'Elasticsearch', 'Solr',
  'Networking', 'TCP/IP', 'DNS', 'Load Balancing', 'SSL/TLS',
  'Penetration Testing', 'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark',
  'SQL', 'NoSQL', 'Data Analysis', 'Machine Learning', 'Deep Learning', 'NLP',
  'System Design', 'Microservices', 'Serverless', 'CI/CD', 'DevOps', 'SRE',
]

const commonTools = {
  'Frontend Developer': ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Redux', 'Git', 'Figma'],
  'Backend Developer': ['Node.js', 'Python', 'Java', 'Express', 'Django', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Git', 'REST APIs'],
  'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Docker', 'TypeScript', 'Git', 'REST APIs', 'GraphQL'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Linux', 'Git', 'Prometheus', 'Grafana'],
  'Data Scientist': ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Jupyter', 'Tableau', 'R'],
  'ML Engineer': ['Python', 'TensorFlow', 'PyTorch', 'MLflow', 'Docker', 'Kubernetes', 'Hugging Face', 'SQL'],
  'Cloud Architect': ['AWS', 'Azure', 'GCP', 'Terraform', 'Docker', 'Kubernetes', 'Networking', 'Security'],
  'System Administrator': ['Linux', 'Windows Server', 'Ansible', 'Bash', 'Python', 'Networking', 'AWS', 'Docker'],
  'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'PHP', 'MySQL', 'Git', 'Bootstrap'],
  'Mobile App Developer': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase', 'REST APIs', 'Git'],
  'Data Analyst': ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI', 'R', 'Pandas'],
  'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Zeplin', 'InVision', 'Photoshop', 'Illustrator'],
  'QA Engineer': ['Selenium', 'Cypress', 'Jest', 'Pytest', 'JUnit', 'Jira', 'Git'],
  'Cybersecurity Analyst': ['Networking', 'Penetration Testing', 'Burp Suite', 'Nmap', 'Wireshark', 'Linux', 'Python'],
  'default': ['Git', 'SQL', 'Python', 'JavaScript', 'Linux', 'Docker', 'REST APIs', 'Agile']
}

function CandidateInfo() {
  const navigate = useNavigate()
  const role = localStorage.getItem('interviewRole') || 'Developer'
  const tools = commonTools[role] || commonTools['default']

  const [level, setLevel] = useState(null)
  const [selectedTools, setSelectedTools] = useState([])
  const [customTool, setCustomTool] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleTool = (tool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
  }

  const handleCustomToolInput = (value) => {
    setCustomTool(value)
    if (value.trim().length >= 1) {
      const filtered = ALL_SKILLS.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !tools.includes(skill) &&
        !selectedTools.includes(skill)
      ).slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (skill) => {
    if (!selectedTools.includes(skill)) {
      setSelectedTools(prev => [...prev, skill])
    }
    setCustomTool('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleStart = () => {
    if (!level) { setError('Please select your experience level'); return }
    localStorage.setItem('candidateLevel', level.id)
    localStorage.setItem('candidateTools', JSON.stringify(selectedTools))
    navigate('/interview')
  }

  return (
    <div className="info-page">
      <div className="info-container">

        {/* Header with back button */}
        <div className="info-header">
          <button className="back-btn" onClick={() => navigate('/role-select')}>
            ← Back
          </button>
          <h1>Tell Us About Yourself</h1>
          <p>This helps us tailor the interview to your level</p>
          <div className="role-pill">🎯 {role}</div>
        </div>

        {/* Experience Level */}
        <div className="info-section">
          <h2>Experience Level</h2>
          <div className="level-grid">
            {experienceLevels.map(l => (
              <div
                key={l.id}
                className={`level-card ${level?.id === l.id ? 'selected' : ''}`}
                onClick={() => setLevel(l)}
              >
                <span className="level-icon">{l.icon}</span>
                <h3>{l.label}</h3>
                <p>{l.desc}</p>
                {level?.id === l.id && <span className="check">✔</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="info-section">
          <h2>Tools & Technologies You Know <span style={{ color:'#888',fontSize:'14px',fontWeight:'400' }}>(Select all that apply)</span></h2>
          <div className="tools-grid">
            {tools.map(tool => (
              <div
                key={tool}
                className={`tool-chip ${selectedTools.includes(tool) ? 'selected' : ''}`}
                onClick={() => toggleTool(tool)}
              >
                {selectedTools.includes(tool) ? '✓ ' : ''}{tool}
              </div>
            ))}
            {/* Extra selected tools not in default list */}
            {selectedTools.filter(t => !tools.includes(t)).map(tool => (
              <div
                key={tool}
                className="tool-chip selected extra"
                onClick={() => toggleTool(tool)}
              >
                ✓ {tool} ✕
              </div>
            ))}
          </div>

          {/* Add skill with dropdown */}
          <div className="custom-tool-wrapper">
            <div className="custom-tool">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search and add a skill (e.g. Kafka, Redis...)"
                value={customTool}
                onChange={e => handleCustomToolInput(e.target.value)}
                onFocus={() => customTool.length > 0 && setShowSuggestions(suggestions.length > 0)}
              />
            </div>

            {/* Dropdown suggestions */}
            {showSuggestions && (
              <div className="suggestions-dropdown" ref={suggestionsRef}>
                {suggestions.map(skill => (
                  <div
                    key={skill}
                    className="suggestion-item"
                    onMouseDown={() => selectSuggestion(skill)}
                  >
                    + {skill}
                  </div>
                ))}
              </div>
            )}

            {/* No match message */}
            {customTool.length > 1 && suggestions.length === 0 && (
              <p style={{ color:'#666',fontSize:'13px',marginTop:'8px' }}>
                No matching skills found. Please search from the available list.
              </p>
            )}
          </div>
        </div>

        {error && <p className="info-error">{error}</p>}

        <button className="start-btn" onClick={handleStart}>
          Start Interview →
        </button>
      </div>
    </div>
  )
}

export default CandidateInfo 