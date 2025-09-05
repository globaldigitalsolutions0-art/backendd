import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  employee_no: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  shift_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: false // Set to false to allow employees without shifts initially
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;