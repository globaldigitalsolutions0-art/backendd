// Script to create employee record and assign shift for Employee 2 (Saqlain)
// This will fix the issue where attendance exists but no employee/shift record
import mongoose from 'mongoose'

// You'll need to update these with your actual database connection details
const DB_URI = 'mongodb://localhost:27017/attendance_system' // Update this

// Simple models for this script
const EmployeeSchema = new mongoose.Schema({
  employee_no: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shift_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

const ShiftSchema = new mongoose.Schema({
  start_time: { type: String, required: true },
  start_period: { type: String, required: true, enum: ['AM', 'PM'] },
  end_time: { type: String, required: true },
  end_period: { type: String, required: true, enum: ['AM', 'PM'] }
})

const Employee = mongoose.model('Employee', EmployeeSchema)
const Shift = mongoose.model('Shift', ShiftSchema)

async function createEmployeeAndAssignShift() {
  try {
    // Connect to database
    await mongoose.connect(DB_URI)
    console.log('✅ Connected to MongoDB')

    // Check if employee 2 exists
    let employee = await Employee.findOne({ employee_no: "2" })
    
    if (!employee) {
      console.log('❌ Employee 2 not found, creating...')
      
      // Create employee record
      employee = new Employee({
        employee_no: "2",
        name: "Saqlain",
        shift_id: null
      })
      await employee.save()
      console.log('✅ Created employee record for Saqlain (Employee 2)')
    } else {
      console.log('✅ Employee 2 found:', employee.name)
    }

    // Check if the night shift exists (based on your shift data)
    let nightShift = await Shift.findOne({ 
      start_time: "21:00", 
      start_period: "PM",
      end_time: "06:00",
      end_period: "AM"
    })

    if (!nightShift) {
      console.log('❌ Night shift not found, creating...')
      
      // Create the night shift
      nightShift = new Shift({
        start_time: "21:00",
        start_period: "PM", 
        end_time: "06:00",
        end_period: "AM"
      })
      await nightShift.save()
      console.log('✅ Created night shift (21:00 PM - 06:00 AM)')
    } else {
      console.log('✅ Night shift found:', nightShift._id)
    }

    // Assign shift to employee if not already assigned
    if (!employee.shift_id || !employee.shift_id.equals(nightShift._id)) {
      employee.shift_id = nightShift._id
      employee.updated_at = new Date()
      await employee.save()
      console.log('✅ Assigned night shift to Employee 2 (Saqlain)')
    } else {
      console.log('✅ Employee already has correct shift assigned')
    }

    // Verify the assignment
    const updatedEmployee = await Employee.findOne({ employee_no: "2" }).populate('shift_id')
    console.log('\\n🔍 Final Verification:')
    console.log('Employee:', updatedEmployee.employee_no, '-', updatedEmployee.name)
    console.log('Shift:', updatedEmployee.shift_id?.start_time, updatedEmployee.shift_id?.start_period, 
                'to', updatedEmployee.shift_id?.end_time, updatedEmployee.shift_id?.end_period)

    console.log('\\n✅ Setup completed! Employee 2 should now show proper late/on-time status.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Uncomment the line below to run this script
// createEmployeeAndAssignShift()

export default createEmployeeAndAssignShift