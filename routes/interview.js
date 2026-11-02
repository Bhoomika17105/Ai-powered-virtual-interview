import express from 'express'
import mongoose from 'mongoose'
import Interview from '../models/Interview.js'

const interviewRouter = express.Router()

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const roleTopics = {
  'Frontend Developer': ['HTML/CSS fundamentals', 'JavaScript ES6+', 'React/Vue/Angular', 'Responsive Design', 'Performance Optimization', 'Browser APIs', 'Git workflow', 'Accessibility'],
  'Backend Developer': ['Node.js/Python/Java', 'REST API design', 'Database design', 'Authentication/JWT', 'System Design', 'Performance', 'Security', 'Caching'],
  'Full Stack Developer': ['Frontend frameworks', 'Backend APIs', 'Database design', 'DevOps basics', 'System Design', 'Security', 'Performance'],
  'DevOps Engineer': ['CI/CD pipelines', 'Docker/Kubernetes', 'Linux administration', 'Cloud services', 'Monitoring/Logging', 'Infrastructure as Code', 'Security', 'Networking'],
  'Data Scientist': ['Python/R', 'Machine Learning algorithms', 'Statistics', 'Data Analysis', 'Deep Learning', 'Model Deployment', 'Data Visualization'],
  'ML Engineer': ['Machine Learning', 'Deep Learning', 'Python', 'Model Training/Tuning', 'MLOps', 'NLP/Computer Vision', 'Model Deployment'],
  'Cloud Architect': ['AWS/Azure/GCP services', 'Architecture Design', 'Security', 'Cost Optimization', 'Networking', 'Databases', 'High Availability'],
  'System Administrator': ['Linux/Windows Server', 'Networking', 'Security', 'Automation/Scripting', 'Monitoring', 'Troubleshooting', 'Backup/Recovery'],
  'Web Developer': ['HTML/CSS', 'JavaScript', 'Frameworks', 'Performance', 'SEO basics', 'Responsive Design'],
  'Mobile App Developer': ['React Native/Flutter', 'State Management', 'APIs integration', 'Performance', 'App Store deployment'],
  'Data Analyst': ['SQL', 'Excel/Sheets', 'Python/R', 'Tableau/Power BI', 'Data Cleaning', 'Statistical Analysis'],
  'UI/UX Designer': ['Design principles', 'Figma/Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Accessibility'],
  'QA Engineer': ['Manual Testing', 'Automation frameworks', 'API Testing', 'Test Planning', 'Bug reporting'],
  'default': ['Technical Skills', 'Problem Solving', 'Team Collaboration', 'Communication', 'Project Experience']
}

async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('No Groq API key. Add GROQ_API_KEY to your .env file')
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty response from Groq')
  return text
}

function extractJSON(text) {
  try { return JSON.parse(text) } catch {}
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(stripped.substring(start, end + 1)) } catch {}
  }
  throw new Error('Could not extract JSON from response')
}

interviewRouter.post('/start-interview', async (req, res) => {
  try {
    const { userId, role } = req.body
    if (!userId) return res.json({ success: false, message: 'Please login again.' })
    if (!role) return res.json({ success: false, message: 'Please select a role.' })
    let userObjectId
    try { userObjectId = new mongoose.Types.ObjectId(userId) }
    catch (e) { return res.json({ success: false, message: 'Invalid userId.' }) }
    const interview = new Interview({ userId: userObjectId, role, startTime: new Date(), status: 'ongoing' })
    const saved = await interview.save()
    return res.json({ success: true, interviewId: saved._id })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
})

interviewRouter.post('/next-question', async (req, res) => {
  try {
    const { role, lastAnswer, questionNumber, answerHistory, candidateLevel, candidateTools, totalQuestions } = req.body
    const qNum = questionNumber || 1
    const r = role || 'Software Developer'
    const level = candidateLevel || 'fresher'
    const tools = candidateTools || []
    const TOTAL_Q = totalQuestions || 10   // dynamic: sent from frontend
    const topics = roleTopics[r] || roleTopics['default']
    const remainingQuestions = TOTAL_Q - qNum
    const isFresher = level === 'fresher'

    const historyText = (answerHistory || [])
      .map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`)
      .join('\n\n')

    const cleanedAnswer = (lastAnswer || '')
      .replace(/\b(um|uh|like|you know)\b/gi, '')
      .replace(/\s+/g, ' ').trim()

    const toolsCtx = tools.length > 0
      ? `Candidate skills (use occasionally, do not limit questions): ${tools.join(', ')}.`
      : ''
    const coveredTopics = (answerHistory || []).map(h => h.question).join(' ').substring(0, 400)

    let prompt

    if (qNum === 1 || !lastAnswer) {
      if (isFresher) {
        prompt = `You are a professional technical interviewer for ${r}.
Candidate is a FRESHER (student or fresh graduate). ${toolsCtx}
Ask ONE warm opening question about their background, studies, or projects they built.
Return ONLY the plain question. No asterisks, no markdown.`
      } else {
        prompt = `You are a professional technical interviewer for ${r}.
Candidate level: ${level}. ${toolsCtx}
Ask ONE opening scenario or technical concept question for ${level} level.
Do NOT ask "tell me about yourself". Give a real scenario or concept to solve.
Example: "A production deployment just caused downtime. Walk me through how you would respond."
Return ONLY the plain question. No asterisks, no markdown.`
      }
    } else {
      if (isFresher) {
        prompt = `You are a strict technical interviewer for ${r}.
Candidate is FRESHER. ${toolsCtx}
Topics: ${topics.join(', ')}. Remaining: ${remainingQuestions}/${TOTAL_Q}
Already covered: ${coveredTopics}

History:
${historyText}

Last answer: "${cleanedAnswer}"

Ask question ${qNum}. FRESHER RULES:
1. NEVER repeat any previous question
2. Cover ALL role topics broadly (70-80%), use candidate skills occasionally (20-30%)
3. 70% TECHNICAL - concepts, fundamentals, simple problem-solving
4. 30% scenario-based (simple scenarios only)
5. Weak answer: ask simpler sub-question or switch topic
6. Strong answer: go slightly deeper
7. SHORT and DIRECT. No praise, no explanation.
Return ONLY plain question. No asterisks, no markdown.`
      } else {
        prompt = `You are a strict professional technical interviewer for ${r}.
Candidate level: ${level}. ${toolsCtx}
Topics: ${topics.join(', ')}. Remaining: ${remainingQuestions}/${TOTAL_Q}
Already covered: ${coveredTopics}

History:
${historyText}

Last answer: "${cleanedAnswer}"

Ask question ${qNum}. EXPERIENCED CANDIDATE RULES:
1. NEVER ask "what was your experience with X" - they already listed skills
2. NEVER repeat any previous question
3. Give REAL SCENARIOS - test how they think and solve problems
4. Mix: scenario-based, concept explanation, architecture/design, troubleshooting
5. Cover ALL role topics broadly (70-80%), use candidate skills occasionally (20-30%)
6. Weak answer: probe deeper with simpler sub-scenario
7. Strong answer: give harder or more complex scenario
8. Concise and direct. No flattery.
Return ONLY plain question. No asterisks, no markdown.`
      }
    }

    try {
      const question = await callGroq(prompt)
      const cleaned = question.replace(/[*`#]/g, '').replace(/\n+/g, ' ').replace(/^\d+\.\s*/, '').trim()
      return res.json({ success: true, question: cleaned })
    } catch (aiError) {
      console.error('Groq failed, using fallback:', aiError.message)
      const fresherFallback = [
        `Tell me about your background and interest in ${r}.`,
        'What programming concepts have you studied so far?',
        'Explain what a REST API is in your own words.',
        'What is the difference between synchronous and asynchronous code?',
        'How would you approach debugging an error you have never seen?',
        'Explain how a database works at a basic level.',
        'What is version control and why is it important?',
        'Describe a project you built and challenges you faced.',
        'What is the difference between a function and a class?',
        'Where do you want to grow technically in the next year?'
      ]
      const expFallback = [
        `A production server is down and users cannot access the service. Walk me through your incident response.`,
        `How would you design a system that handles 1 million requests per day?`,
        `Your team is experiencing slow deployments. What would you investigate and how would you fix it?`,
        `How would you implement authentication in a microservices architecture?`,
        `A database query is taking 10 seconds. How would you optimize it?`,
        `How would you set up monitoring and alerting for a production application?`,
        `Your team has a memory leak in production. How do you identify and fix it?`,
        `What are the trade-offs between SQL and NoSQL databases?`,
        `How would you handle a situation where a deployment broke production?`,
        `Design a caching strategy for a high-traffic web application.`
      ]
      const fallback = isFresher ? fresherFallback : expFallback
      return res.json({ success: true, question: fallback[(qNum - 1) % fallback.length] })
    }
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
})

interviewRouter.post('/generate-report', async (req, res) => {
  try {
    const { role, answerHistory, totalTime, questionCount, candidateLevel, candidateTools, totalQuestions } = req.body
    if (!answerHistory || answerHistory.length === 0) return res.json({ success: false, message: 'No data' })

    const TOTAL_Q = totalQuestions || 10
    const level = candidateLevel || 'fresher'
    const tools = candidateTools || []
    const fullInterview = answerHistory.map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`).join('\n\n')
    const isIncomplete = questionCount < Math.ceil(TOTAL_Q * 0.4)  // less than 40% of questions = incomplete

    const prompt = `You are an expert technical interviewer evaluating a ${role} mock interview.
Level: ${level}. Tools: ${tools.join(', ') || 'N/A'}. Questions answered: ${questionCount}/${TOTAL_Q}. Time: ${totalTime} min.
Status: ${isIncomplete ? 'INCOMPLETE - candidate left too early' : 'COMPLETED'}

Transcript:
${fullInterview}

${isIncomplete ? `INCOMPLETE RULES: grade max C, reduce overallScore below 50, summary must say "Interview was not completed", hiringRecommendation must be "No", nextSteps must include "Complete a full interview".` : `Evaluate fairly based on ${level} level expectations.`}

Return ONLY raw JSON with no markdown, no backticks, no extra text before or after:
{"overallScore":75,"grade":"B+","summary":"summary","technicalScore":70,"communicationScore":80,"confidenceScore":75,"strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"opportunities":["o1","o2","o3"],"threats":["t1","t2"],"technicalFeedback":"feedback","communicationFeedback":"feedback","topSkillsShown":["sk1","sk2","sk3"],"skillGaps":["g1","g2","g3"],"recommendations":["r1","r2","r3"],"hiringRecommendation":"Yes","nextSteps":"plan"}`

    const reportText = await callGroq(prompt)
    console.log('Groq report (first 300):', reportText.substring(0, 300))

    let report
    try { report = extractJSON(reportText) }
    catch (e) {
      console.error('JSON parse failed:', e.message)
      return res.json({ success: false, message: 'Failed to parse report. Please try again.' })
    }

    return res.json({ success: true, report })
  } catch (error) {
    console.error('generate-report error:', error.message)
    return res.json({ success: false, message: error.message })
  }
})

interviewRouter.post('/end-interview', async (req, res) => {
  try {
    const { interviewId } = req.body
    await Interview.findByIdAndUpdate(interviewId, { status: 'completed' })
    return res.json({ success: true })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
})

export default interviewRouter
 