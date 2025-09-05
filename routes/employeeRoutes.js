import express from 'express';
import { getEmployees, getEmployee, saveEmployee, deleteEmployee } from '../controllers/employeeController.js';

const router = express.Router();

// Get all employees
router.get('/', getEmployees);

// Get a single employee by employee_no
router.get('/:employee_no', getEmployee);

// Create or update employee
router.post('/', saveEmployee);

// Delete employee details
router.delete('/:employee_no', deleteEmployee);

export default router;