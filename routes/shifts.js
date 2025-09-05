import express from 'express';
import { getShifts, createShift, deleteShift } from '../controllers/employeeController.js';

const router = express.Router();

// Route to get all shifts
router.get('/', getShifts);

// Route to create a new shift
router.post('/', createShift);

// Route to delete a shift by ID
router.delete('/:id', deleteShift);

export default router;