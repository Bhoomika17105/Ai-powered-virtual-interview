import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Interview.css'

const BACKEND_URL = 'http://localhost:4000'

const DURATION_OPTIONS = [
  { label: '5 min',  minutes: 5,  questions: 5  },
  { label: '10 min', minutes: 10, questions: 10 },
  { label: '15 min', minutes: 15, questions: 15 },
  { label: '30 min', minutes: 30, questions: 20 },
]

function cleanForSpeech(text) {
  return text
    .replace(/\*/g, '').replace(/\\/g, '').replace(/`/g, '')
    .replace(/#/g, '').replace(/\[/g, '').replace(/\]/g, '')
    .replace(/\(/g, '').replace(/\)/g, '').replace(/>/g, '')
    .replace(/\|/g, '').replace(/_{2,}/g, '').replace(/\s+/g, ' ')
    .trim()
}

function DurationSelector({ onStart }) {
  const [selected, setSelected] = useState(1)
  const opt = DURATION_OPTIONS[selected]

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', color: '#fff', padding: '24px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
      <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Choose Interview Duration</h2>
      <p style={{ color: '#888', marginBottom: '40px', fontSize: '15px' }}>Select how long you want your interview to be</p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
        {DURATION_OPTIONS.map((o, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              width: '145px', padding: '28px 16px', borderRadius: '16px', cursor: 'pointer',
              border: selected === i ? '2px solid #7494ec' : '2px solid #2a2d3a',
              background: selected === i ? '#7494ec22' : '#1a1d27',
              color: '#fff', fontFamily: 'Poppins', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: '800', color: selected === i ? '#7494ec' : '#fff' }}>
              {o.minutes}
            </span>
            <span style={{ fontSize: '13px', color: '#aaa' }}>minutes</span>
            <span style={{
              fontSize: '12px', fontWeight: '600', marginTop: '6px',
              color: selected === i ? '#7494ec' : '#666',
              background: selected === i ? '#7494ec33' : '#2a2d3a',
              padding: '4px 12px', borderRadius: '20px'
            }}>
              {o.questions} Questions
            </span>
          </button>
        ))}
      </div>

      <div style={{
        background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '12px',
        padding: '14px 32px', marginBottom: '32px', color: '#888', fontSize: '14px', textAlign: 'center'
      }}>
        {opt.minutes} min &nbsp;•&nbsp; {opt.questions} questions &nbsp;•&nbsp;
        ~{Math.round((opt.minutes * 60) / opt.questions)} sec per question
      </div>

      <button
        onClick={() => onStart(opt)}
        style={{
          background: '#7494ec', color: '#fff', border: 'none',
          padding: '14px 44px', borderRadius: '12px', fontSize: '16px',
          fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins'
        }}
      >
        Start Interview →
      </button>
    </div>
  )
}

function Interview() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const hasFetched = useRef(false)
  const monitoringRef = useRef(null)
  const absentFramesRef = useRef(0)

  const [started, setStarted] = useState(false)
  const [maxQuestions, setMaxQuestions] = useState(10)
  const [timeLeft, setTimeLeft] = useState(600)

  const [question, setQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [answerHistory, setAnswerHistory] = useState([])
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState([])
  const [warningCount, setWarningCount] = useState(0)

  const role = localStorage.getItem('interviewRole') || 'Software Developer'
  const interviewId = localStorage.getItem('interviewId')
  const candidateLevel = localStorage.getItem('candidateLevel') || 'fresher'
  const candidateTools = JSON.parse(localStorage.getItem('candidateTools') || '[]')
  const startTimeRef = useRef(Date.now())

  const handleDurationSelect = (opt) => {
    setMaxQuestions(opt.questions)
    setTimeLeft(opt.minutes * 60)
    localStorage.setItem('interviewMaxQuestions', String(opt.questions))
    localStorage.setItem('interviewDurationMins', String(opt.minutes))
    setStarted(true)
  }

  const addWarning = (msg) => {
    const timestamp = new Date().toLocaleTimeString()
    const entry = `${timestamp}: ${msg}`
    setWarnings(prev => {
      const updated = [...prev, entry]
      localStorage.setItem('interviewWarnings', JSON.stringify(updated))
      return updated
    })
    setWarningCount(prev => {
      const updated = prev + 1
      localStorage.setItem('warningCount', String(updated))
      return updated
    })
  }

  useEffect(() => {
    if (!started) return
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Your interview progress will be lost. Are you sure?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [started])

  useEffect(() => {
    if (!started) return
    const handleVisibilityChange = () => {
      if (document.hidden) addWarning('⚠️ Tab switched or window minimized')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [started])

  useEffect(() => {
    if (!started) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleInterviewEnd() }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [started])

  useEffect(() => {
    if (!started) return
    let retryCount = 0
    const tryCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {})
            setCameraOn(true)
            startMonitoring()
          }
        }
      } catch {
        if (retryCount < 3) { retryCount++; setTimeout(tryCamera, 1000) }
        else setCameraOn(false)
      }
    }
    tryCamera()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (monitoringRef.current) clearInterval(monitoringRef.current)
    }
  }, [started])

  const startMonitoring = () => {
    const canvas = document.createElement('canvas')
    monitoringRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video || !video.videoWidth || video.readyState < 2) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let totalBrightness = 0, skinPixels = 0, sampleCount = 0
      for (let i = 0; i < data.length; i += 400) {
        const r = data[i], g = data[i+1], b = data[i+2]
        totalBrightness += (r + g + b) / 3
        sampleCount++
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) skinPixels++
      }
      const avgBrightness = totalBrightness / sampleCount
      const skinRatio = skinPixels / sampleCount
      if (avgBrightness < 15) { addWarning('⚠️ Camera appears covered or too dark'); return }
      if (avgBrightness > 245) { addWarning('⚠️ Unusual bright light detected near camera'); return }
      const personPresent = skinRatio > 0.02
      if (!personPresent) {
        absentFramesRef.current += 1
        if (absentFramesRef.current === 3) addWarning('⚠️ Candidate appears to have left the camera frame')
      } else {
        if (absentFramesRef.current >= 3) {
          const timestamp = new Date().toLocaleTimeString()
          const entry = `${timestamp}: ℹ️ Candidate returned to camera frame`
          setWarnings(prev => { const updated = [...prev, entry]; localStorage.setItem('interviewWarnings', JSON.stringify(updated)); return updated })
        }
        absentFramesRef.current = 0
      }
    }, 5000)
  }

  useEffect(() => {
    if (!started || hasFetched.current) return
    hasFetched.current = true
    fetchQuestion(null, 1, [])
  }, [started])

  const fetchQuestion = async (lastAnswer, qNumber, history) => {
    setIsLoading(true); setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          interviewId, role, lastAnswer, questionNumber: qNumber,
          answerHistory: history, candidateLevel, candidateTools,
          totalQuestions: maxQuestions
        })
      })
      const data = await res.json()
      if (data.success && data.question) {
        setQuestion('')
        setTimeout(() => { setQuestion(data.question); speakQuestion(data.question) }, 150)
      } else { setError('Failed to load question.') }
    } catch { setError('Server error. Please check backend.') }
    finally { setIsLoading(false) }
  }

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel()
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(cleanForSpeech(text))
      utter.rate = 0.92; utter.pitch = 1
      utter.onstart = () => setIsSpeaking(true)
      utter.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utter)
    }, 300)
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Use Chrome browser.'); return }
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'
    r.onresult = (e) => setTranscript(Array.from(e.results).map(r => r[0].transcript).join(''))
    r.onerror = () => setIsListening(false)
    r.onend = () => setIsListening(false)
    recognitionRef.current = r; r.start(); setIsListening(true)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false) }

  const handleInterviewEnd = (finalHistory, finalQNum) => {
    const history = finalHistory || answerHistory
    const qNum = finalQNum || questionNumber
    stopListening(); window.speechSynthesis.cancel()
    if (monitoringRef.current) clearInterval(monitoringRef.current)
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 60000)
    localStorage.setItem('interviewHistory', JSON.stringify(history))
    localStorage.setItem('interviewTime', String(timeTaken))
    localStorage.setItem('interviewQCount', String(qNum))
    localStorage.removeItem('cachedReport')
    window.onbeforeunload = null
    navigate('/report')
  }

  const handleSubmit = async () => {
    if (!transcript.trim()) return
    stopListening(); window.speechSynthesis.cancel()
    const curr = { q: question, a: transcript, n: questionNumber }
    const newHistory = [...answerHistory, { question: curr.q, answer: curr.a }]
    setAnswerHistory(newHistory); setTranscript('')
    if (curr.n >= maxQuestions || timeLeft < 60) { handleInterviewEnd(newHistory, curr.n); return }
    const next = curr.n + 1; setQuestionNumber(next)
    await fetchQuestion(curr.a, next, newHistory)
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const levelLabel = { fresher: '🎓 Fresher', junior: '🌱 Junior', mid: '💼 Mid-Level', senior: '🚀 Senior' }

  if (!started) return <DurationSelector onStart={handleDurationSelect} />

  return (
    <div className="interview-page">
      <div className="interview-header">
        <div className="header-left">
          <span className="role-badge">🎯 {role}</span>
          <span className="role-badge level-badge">{levelLabel[candidateLevel]}</span>
          <span className="q-count">Question {questionNumber} / {maxQuestions}</span>
          {warningCount > 0 && <span className="warning-badge">⚠️ {warningCount} alert{warningCount > 1 ? 's' : ''}</span>}
        </div>
        <div className={`timer ${timeLeft < 120 ? 'urgent' : ''}`}>⏱ {formatTime(timeLeft)}</div>
        <button className="end-btn" onClick={() => handleInterviewEnd()}>End Interview</button>
      </div>

      {warnings.length > 0 && <div className="warning-bar">{warnings[warnings.length - 1]}</div>}

      <div className="interview-body">
        <div className="left-panel">
          <div className="camera-box">
            <video ref={videoRef} autoPlay muted playsInline className="camera-feed" style={{ display: cameraOn ? 'block' : 'none' }} />
            {!cameraOn && <div className="no-camera">📷<br />Camera unavailable<br /><small>Allow camera in browser</small></div>}
            <div className={`mic-indicator ${isListening ? 'active' : ''}`}>{isListening ? '🔴 Recording...' : '⚪ Mic off'}</div>
            {warningCount > 0 && <div className="camera-warning">⚠️ {warningCount}</div>}
          </div>
          <div className="controls">
            {!isListening
              ? <button className="mic-btn start" onClick={startListening}>🎤 Start Answer</button>
              : <button className="mic-btn stop" onClick={stopListening}>⏹ Stop</button>
            }
            <button className={`submit-btn ${!transcript.trim() ? 'disabled' : ''}`} onClick={handleSubmit} disabled={!transcript.trim() || isLoading}>
              {isLoading ? '⏳ Loading next question...' : 'Submit Answer →'}
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="question-box">
            <div className="question-label">{isSpeaking ? '🔊 Speaking...' : '❓ Current Question'}</div>
            <div className="question-content">
              {isLoading ? <div className="loading-dots"><span /><span /><span /></div> : <div className="question-text">{question}</div>}
            </div>
            {error && <p className="interview-error">{error}</p>}
            <button className="replay-btn" onClick={() => speakQuestion(question)}>🔁 Replay Question</button>
          </div>
          <div className="transcript-box">
            <div className="transcript-label">🎧 Your Answer</div>
            <p className="transcript-text">{transcript || 'Click "Start Answer" and speak your answer...'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview
 