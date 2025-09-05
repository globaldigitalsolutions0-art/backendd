import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import attendanceRoutes from './routes/attendanceRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import consoleRoutes from './routes/consoleRoutes.js';
import { logger } from './controllers/consoleController.js';
import shiftRoutes from './routes/shifts.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// ---------- CONFIG ----------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/new_ams';
const PORT = process.env.PORT || 3001;

// ---------- DB CONNECTION ----------
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// ---------- APP SETUP ----------
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Serve console interface
app.get('/console', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'console.html'));
});

// ---------- ROUTES ----------
app.use('/api', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/console', consoleRoutes);
app.use('/api/shifts', shiftRoutes);
// ---------- SERVER START ----------
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    logger.log(`Attendance API on http://localhost:${PORT}`);
    logger.log(`Server console available at http://localhost:${PORT}/api/console`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});