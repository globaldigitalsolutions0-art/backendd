import Employee from '../models/Employee.js';
import Event from '../models/Event.js';
import Shift from '../models/Shift.js';

// Get all employees (with or without details)
export const getEmployees = async (req, res) => {
  console.log('getEmployees');
  try {
    const eventEmployees = await Event.aggregate([
      { $group: { _id: "$employee_no" } },
      { $project: { employee_no: "$_id", _id: 0 } }
    ]);
    
    const namedEmployees = await Employee.find({}, 'employee_no name shift_id');
    
    const employeeMap = {};
    namedEmployees.forEach(emp => {
      employeeMap[emp.employee_no] = {
        name: emp.name,
        shift_id: emp.shift_id
      };
    });
    
    const allEmployees = eventEmployees.map(emp => {
      const details = employeeMap[emp.employee_no];
      return {
        employee_no: emp.employee_no,
        name: details?.name || null,
        shift_id: details?.shift_id || null,
        has_details: !!(details?.name && details?.shift_id)
      };
    });
    
    res.json(allEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single employee by employee_no
export const getEmployee = async (req, res) => {
  try {
    const { employee_no } = req.params;
    
    // Find employee in Employee collection
    const employee = await Employee.findOne({ employee_no });
    
    if (employee) {
      return res.json({
        employee_no,
        name: employee.name,
        shift_id: employee.shift_id,
        has_details: !!(employee.name && employee.shift_id)
      });
    }
    
    // Check if employee exists in events
    const eventEmployee = await Event.findOne({ employee_no });
    
    if (eventEmployee) {
      return res.json({
        employee_no,
        name: null,
        shift_id: null,
        has_details: false
      });
    }
    
    return res.status(404).json({ message: 'Employee not found' });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create or update employee details
export const saveEmployee = async (req, res) => {
  try {
    const { employee_no, name, shift_id } = req.body;
    
    if (!employee_no || !name || !shift_id) {
      return res.status(400).json({ message: 'Employee number, name, and shift ID are required' });
    }
    
    // Check if employee exists in events
    const eventEmployee = await Event.findOne({ employee_no });
    if (!eventEmployee) {
      return res.status(404).json({ message: 'Employee not found in events' });
    }
    
    // Check if shift_id exists
    const shift = await Shift.findById(shift_id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Update or create employee
    const employee = await Employee.findOneAndUpdate(
      { employee_no },
      { 
        name,
        shift_id,
        updated_at: new Date()
      },
      { new: true, upsert: true }
    );
    
    res.json({
      employee_no,
      name: employee.name,
      shift_id: employee.shift_id,
      has_details: !!(employee.name && employee.shift_id)
    });
  } catch (error) {
    console.error('Error saving employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete employee details
export const deleteEmployee = async (req, res) => {
  try {
    const { employee_no } = req.params;
    
    const result = await Employee.findOneAndDelete({ employee_no });
    
    if (!result) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee details removed successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all shifts
export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({});
    console.log('Fetched shifts:', shifts); // Debug log
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new shift
export const createShift = async (req, res) => {
  try {
    const { start_time, start_period, end_time, end_period } = req.body;
    
    console.log('Creating shift with:', { start_time, start_period, end_time, end_period });
    
    if (!start_time || !start_period || !end_time || !end_period) {
      return res.status(400).json({ message: 'Start time, start period, end time, and end period are required' });
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM' });
    }
    
    // Create and save shift
    const shift = new Shift({ start_time, start_period, end_time, end_period });
    await shift.save();
    
    console.log('Shift created:', shift);
    res.status(201).json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete shift
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Shift.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Remove shift_id from employees if the shift is deleted
    await Employee.updateMany({ shift_id: id }, { $set: { shift_id: null } });
    
    console.log('Shift deleted:', id); // Debug log
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};