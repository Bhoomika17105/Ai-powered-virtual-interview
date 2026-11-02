import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = 'http://localhost:4000'

// Minimum questions answered to get "Hire" per total question count
const HIRE_THRESHOLDS = {
  5:  4,   // 5-min session:  need 4+ questions
  10: 6,   // 10-min session: need 6+ questions
  15: 8,   // 15-min session: need 8+ questions
  20: 10,  // 30-min session: need 10+ questions
}

function getHiringRec(questionsAnswered, totalQuestions, aiRec) {
  const threshold = HIRE_THRESHOLDS[totalQuestions] ?? Math.ceil(totalQuestions * 0.6)
  if (questionsAnswered >= threshold) return 'Hire'
  if (questionsAnswered >= Math.ceil(threshold * 0.6)) return 'Maybe'
  return 'No'
}

function ScoreCircle({ score, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(${color} ${score * 3.6}deg, #2a2d3a 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1a1d27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff' }}>{score}</div>
      </div>
      <div style={{ fontSize: '12px', color: '#888' }}>{label}</div>
    </div>
  )
}

function Report() {
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const hasGenerated = useRef(false)

  const role = localStorage.getItem('interviewRole') || 'Developer'
  const timeTaken = localStorage.getItem('interviewTime') || '10'
  const qCount = parseInt(localStorage.getItem('interviewQCount') || '0')
  const totalQuestions = parseInt(localStorage.getItem('interviewMaxQuestions') || '10')
  const durationMins = localStorage.getItem('interviewDurationMins') || '10'
  const candidateLevel = localStorage.getItem('candidateLevel') || 'fresher'
  const candidateTools = JSON.parse(localStorage.getItem('candidateTools') || '[]')
  const warnings = JSON.parse(localStorage.getItem('interviewWarnings') || '[]')
  const warningCount = parseInt(localStorage.getItem('warningCount') || '0')
  const levelLabel = { fresher: '🎓 Fresher', junior: '🌱 Junior', mid: '💼 Mid-Level', senior: '🚀 Senior' }

  useEffect(() => {
    const cached = localStorage.getItem('cachedReport')
    if (cached) {
      try { setReport(JSON.parse(cached)); setLoading(false); return } catch {}
    }
    if (!hasGenerated.current) {
      hasGenerated.current = true
      generateReport()
    }
  }, [])

  const generateReport = async () => {
    setLoading(true); setError('')
    try {
      const answerHistory = JSON.parse(localStorage.getItem('interviewHistory') || '[]')
      if (answerHistory.length === 0) {
        setError('No interview data found. Please complete an interview first.')
        setLoading(false)
        return
      }
      const res = await fetch(`${BACKEND_URL}/api/interview/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role, answerHistory, totalTime: parseInt(timeTaken), questionCount: qCount, candidateLevel, candidateTools, totalQuestions })
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('cachedReport', JSON.stringify(data.report))
        setReport(data.report)
      } else {
        setError(data.message || 'Failed to generate report')
      }
    } catch { setError('Server error. Please try again.') }
    finally { setLoading(false) }
  }

  const handleNewInterview = () => {
    ['cachedReport','interviewHistory','interviewTime','interviewQCount',
     'interviewWarnings','warningCount','interviewMaxQuestions','interviewDurationMins'].forEach(k => localStorage.removeItem(k))
    navigate('/role-select')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', color: '#fff' }}>
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>🤖</div>
      <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Analyzing Your Interview...</h2>
      <p style={{ color: '#888', marginBottom: '32px' }}>AI is evaluating your performance. Please wait.</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7494ec', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ color: '#fff', marginBottom: '12px' }}>Report Failed</h2>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={generateReport} style={{ background: '#7494ec', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: '600' }}>Try Again</button>
          <button onClick={handleNewInterview} style={{ background: 'transparent', color: '#888', border: '1px solid #2a2d3a', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins' }}>New Interview</button>
        </div>
      </div>
    </div>
  )

  const gradeColor = { 'A+': '#22c55e', 'A': '#22c55e', 'A-': '#22c55e', 'B+': '#7494ec', 'B': '#7494ec', 'B-': '#7494ec', 'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#f59e0b', 'D': '#ff4444', 'F': '#ff4444' }[report?.grade] || '#7494ec'

  const hiringRec = getHiringRec(qCount, totalQuestions, report?.hiringRecommendation)
  const hiringColor = { 'Hire': '#22c55e', 'Maybe': '#f59e0b', 'No': '#ff4444' }[hiringRec] || '#888'

  const threshold = HIRE_THRESHOLDS[totalQuestions] ?? Math.ceil(totalQuestions * 0.6)

  const s = {
    page: { minHeight: '100vh', background: '#0f1117', fontFamily: 'Poppins, sans-serif', padding: '32px', color: '#fff' },
    card: { background: '#1a1d27', borderRadius: '16px', padding: '24px', border: '1px solid #2a2d3a', marginBottom: '16px' }
  }

  return (
    <div style={s.page}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>📊 Interview Scorecard</h1>
          <p style={{ color: '#888' }}>
            {role} &nbsp;•&nbsp; {levelLabel[candidateLevel]} &nbsp;•&nbsp;
            {qCount}/{totalQuestions} Questions &nbsp;•&nbsp; {durationMins} min session
          </p>
        </div>

        {/* Integrity Warning */}
        {warningCount > 0 && (
          <div style={{ ...s.card, background: '#ff444411', border: '1px solid #ff444444', marginBottom: '24px' }}>
            <h3 style={{ color: '#ff4444', marginBottom: '12px', fontSize: '16px' }}>⚠️ Integrity Alerts ({warningCount})</h3>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '12px' }}>The following suspicious activities were detected during the interview:</p>
            {warnings.map((w, i) => (
              <div key={i} style={{ color: '#ff8888', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #ff444422' }}>{w}</div>
            ))}
            <p style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>Note: These alerts may affect the authenticity of this interview result.</p>
          </div>
        )}

        {/* Completion Banner — shown when below threshold */}
        {qCount < threshold && (
          <div style={{ ...s.card, background: '#f59e0b11', border: '1px solid #f59e0b44', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <div>
              <p style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>
                Incomplete Interview — {qCount} of {totalQuestions} questions answered
              </p>
              <p style={{ color: '#aaa', fontSize: '13px' }}>
                You need to answer at least <strong style={{ color: '#fff' }}>{threshold} questions</strong> in this {durationMins}-min session to be eligible for a <strong style={{ color: '#22c55e' }}>Hire</strong> recommendation.
              </p>
            </div>
          </div>
        )}

        {/* Overall Score */}
        <div style={{ ...s.card, textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '72px', fontWeight: '800', color: gradeColor, marginBottom: '4px' }}>{report?.grade}</div>
          <div style={{ fontSize: '42px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{report?.overallScore}/100</div>
          <p style={{ color: '#aaa', fontSize: '15px', maxWidth: '600px', margin: '0 auto 24px' }}>{report?.summary}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <ScoreCircle score={report?.technicalScore} label="Technical" color="#7494ec" />
            <ScoreCircle score={report?.communicationScore} label="Communication" color="#22c55e" />
            <ScoreCircle score={report?.confidenceScore} label="Confidence" color="#f59e0b" />
          </div>
          <div style={{ display: 'inline-block', background: hiringColor + '22', border: `1px solid ${hiringColor}`, borderRadius: '20px', padding: '8px 24px' }}>
            <span style={{ color: hiringColor, fontWeight: '600' }}>Hiring Recommendation: {hiringRec}</span>
          </div>
        </div>

        {/* SWOT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { title: '💪 Strengths', items: report?.strengths, color: '#22c55e', symbol: '✓' },
            { title: '⚠️ Weaknesses', items: report?.weaknesses, color: '#ff4444', symbol: '✗' },
            { title: '🚀 Opportunities', items: report?.opportunities, color: '#7494ec', symbol: '→' },
            { title: '🔥 Threats', items: report?.threats, color: '#f59e0b', symbol: '!' },
          ].map(({ title, items, color, symbol }) => (
            <div key={title} style={{ ...s.card, border: `1px solid ${color}33` }}>
              <h3 style={{ color, marginBottom: '16px', fontSize: '16px' }}>{title}</h3>
              {items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color, marginTop: '2px', flexShrink: 0 }}>{symbol}</span>
                  <span style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={s.card}>
            <h3 style={{ color: '#7494ec', marginBottom: '12px', fontSize: '16px' }}>🔧 Technical Feedback</h3>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>{report?.technicalFeedback}</p>
          </div>
          <div style={s.card}>
            <h3 style={{ color: '#22c55e', marginBottom: '12px', fontSize: '16px' }}>🗣️ Communication Feedback</h3>
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>{report?.communicationFeedback}</p>
          </div>
        </div>

        {/* Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { title: '✅ Skills Demonstrated', items: report?.topSkillsShown, color: '#22c55e' },
            { title: '❌ Skill Gaps', items: report?.skillGaps, color: '#ff4444' },
          ].map(({ title, items, color }) => (
            <div key={title} style={s.card}>
              <h3 style={{ color, marginBottom: '12px', fontSize: '16px' }}>{title}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items?.map((item, i) => (
                  <span key={i} style={{ background: color + '22', border: `1px solid ${color}44`, color, padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div style={{ ...s.card, border: '1px solid #7494ec33', marginBottom: '16px' }}>
          <h3 style={{ color: '#7494ec', marginBottom: '16px', fontSize: '16px' }}>📋 Recommendations</h3>
          {report?.recommendations?.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <span style={{ background: '#7494ec', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div style={{ ...s.card, background: '#7494ec11', border: '1px solid #7494ec33', marginBottom: '32px' }}>
          <h3 style={{ color: '#7494ec', marginBottom: '12px', fontSize: '16px' }}>🎯 Next 30 Days Action Plan</h3>
          <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>{report?.nextSteps}</p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={handleNewInterview} style={{ background: '#7494ec', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins' }}>
            🔄 Start New Interview
          </button>
          <button onClick={() => window.print()} style={{ background: 'transparent', color: '#7494ec', border: '2px solid #7494ec', padding: '14px 32px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins' }}>
            🖨️ Print Report
          </button>
        </div>

      </div>
    </div>
  )
}

export default Report
