import mongoose from 'mongoose'

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  roundType: {
    type: String,
    default: 'technical',
    enum: ['technical', 'hr', 'managerial']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'ongoing',
    enum: ['ongoing', 'completed', 'abandoned']
  },
  qa: [
    {
      question: { type: String },
      answer: { type: String }
    }
  ]
})

const Interview = mongoose.model('Interview', interviewSchema)
export default Interview 