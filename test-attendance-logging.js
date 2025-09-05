// Test script to demonstrate the improved attendance calculation with console logging
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

// Mock data for testing
const mockEmployeeData = [
  {
    employee_no: "001",
    name: "John Doe",
    shift: {
      start_time: "09:00",
      start_period: "AM",
      end_time: "05:00",
      end_period: "PM"
    }
  },
  {
    employee_no: "002", 
    name: "Jane Smith",
    shift: {
      start_time: "08:30",
      start_period: "AM",
      end_time: "04:30",
      end_period: "PM"
    }
  }
]

const mockAttendanceData = [
  {
    employee_no: "001",
    person_name: "John Doe",
    check_in_time: dayjs.tz('2024-01-15 09:20:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi'), // 20 minutes late
    work_date: "2024-01-15"
  },
  {
    employee_no: "002",
    person_name: "Jane Smith", 
    check_in_time: dayjs.tz('2024-01-15 08:25:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi'), // 5 minutes early
    work_date: "2024-01-15"
  }
]

// Simulate the improved late status calculation logic
console.log("=".repeat(60))
console.log("🕐 ATTENDANCE CALCULATION SIMULATION")
console.log("=".repeat(60))

mockAttendanceData.forEach(attendance => {
  const employee = mockEmployeeData.find(emp => emp.employee_no === attendance.employee_no)
  
  if (employee && employee.shift) {
    const { start_time, start_period } = employee.shift
    const dateStr = attendance.work_date
    const check_in_time = attendance.check_in_time
    
    // Calculate shift start time
    const shiftStart = dayjs.tz(
      `${dateStr} ${start_time} ${start_period}`,
      'YYYY-MM-DD HH:mm A',
      'Asia/Karachi'
    )
    
    // Calculate grace period (15 minutes)
    const lateThreshold = shiftStart.add(15, 'minute')
    const late_status = check_in_time.isAfter(lateThreshold) ? 'Late' : 'On Time'
    
    // Enhanced console logging
    const minutesLate = check_in_time.diff(lateThreshold, 'minute')
    
    if (late_status === 'Late') {
      console.log(`🔴 LATE: Employee ${attendance.employee_no} (${employee.name}) on ${dateStr}`)
      console.log(`   Shift Start: ${shiftStart.format('HH:mm A')}`)
      console.log(`   Grace Period Ends: ${lateThreshold.format('HH:mm A')}`)
      console.log(`   Actual Check-in: ${check_in_time.format('HH:mm A')}`)
      console.log(`   Minutes Late: ${minutesLate} minutes\n`)
    } else {
      console.log(`🟢 ON TIME: Employee ${attendance.employee_no} (${employee.name}) on ${dateStr}`)
      console.log(`   Shift Start: ${shiftStart.format('HH:mm A')}`)
      console.log(`   Check-in: ${check_in_time.format('HH:mm A')}\n`)
    }
  }
})

// Simulate monthly summary
console.log("=".repeat(60))
console.log("📊 MONTHLY SUMMARY SIMULATION")
console.log("=".repeat(60))

const monthlySummary = {
  "001": { name: "John Doe", late_count: 5, early_count: 15, total_days: 20 },
  "002": { name: "Jane Smith", late_count: 2, early_count: 18, total_days: 20 }
}

Object.keys(monthlySummary).forEach(emp_no => {
  const emp = monthlySummary[emp_no]
  console.log(`\n=== MONTHLY SUMMARY for Employee ${emp_no} (${emp.name}) ===`)
  console.log(`Total Days: ${emp.total_days}`)
  console.log(`Late Days: ${emp.late_count}`)
  console.log(`On Time Days: ${emp.early_count}`)
  console.log(`Late Percentage: ${((emp.late_count / emp.total_days) * 100).toFixed(1)}%`)
  console.log('===============================================\n')
})

console.log("✅ Test simulation completed!")