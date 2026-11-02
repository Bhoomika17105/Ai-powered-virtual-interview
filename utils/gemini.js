import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const generateQuestion = async (role, questionNumber, lastAnswer, answerHistory) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' }) 

  let prompt = ''

  if (questionNumber === 1) {
    prompt = `You are a strict technical interviewer for the role of ${role}. 
    Ask question number 1 - a clear, direct opening technical question for this role.
    Return ONLY the question, nothing else. No numbering, no explanation.`
  } else {
    const history = answerHistory.map((h, i) =>
      `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`
    ).join('\n\n')

    prompt = `You are a strict technical interviewer for ${role}.

Previous conversation:
${history} 

The candidate just answered: "${lastAnswer}"

Based on their answer, ask a follow-up or cross question that:
- Digs deeper into something they mentioned
- Or tests a related concept they might have missed
- Keep it technical and relevant to ${role}
- Question number ${questionNumber} of 10

Return ONLY the question, nothing else.`
  }

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}  