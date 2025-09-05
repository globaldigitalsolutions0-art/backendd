import express from 'express';
import { 
  getHealth, 
  createEvents, 
  getAttendance, 
  getEvents, 
  getPresentEmployees,
  getMonthlyAttendance 
} from '../controllers/attendanceController.js';

const router = express.Router();

// Health check endpoint
router.get('/health', getHealth);

// Events endpoints
router.post('/events', createEvents);
router.get('/events', getEvents);

// Attendance endpoints
router.get('/attendance', getAttendance);
router.get('/present-employees', getPresentEmployees);

// ✅ Monthly attendance route
router.get('/monthly-attendance', getMonthlyAttendance);

export default router;
