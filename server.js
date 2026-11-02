import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import authRouter from './routes/authRoutes.js'
import interviewRouter from './routes/interview.js'

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// CORS - allows all localhost ports automatically
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.options('/{*path}', cors())  

// Middlewares
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', authRouter)
app.use('/api/interview', interviewRouter)

app.get('/', (req, res) => res.send("API Working"))

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message))

// Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: "Access denied" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}

// Is Authenticated
const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true, userId: req.user.id })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

authRouter.get('/is-auth', verifyToken, isAuthenticated)

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: `Hello user ${req.user.id}, you have access!` })
})

app.listen(port, () => {
  console.log(`Server started on PORT: ${port}`)
})  