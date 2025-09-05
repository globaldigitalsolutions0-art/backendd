// Test case demonstrating Saqlain's attendance calculation
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const DEVICE_TZ = 'Asia/Karachi'
const LATE_THRESHOLD_MINUTES = 15

// Helper function (same as in attendanceController.js)
const parseShiftTime = (dateStr, timeStr, period, timezone) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  let shiftStart
  
  if (hours > 12) {
    // 24-hour format (e.g., "21:00" with "PM")
    const convertedHours = hours - 12
    const convertedTime = `${convertedHours}:${minutes.toString().padStart(2, '0')}`
    shiftStart = dayjs.tz(
      `${dateStr} ${convertedTime} PM`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else if (hours === 0) {
    // Midnight format ("00:xx")
    shiftStart = dayjs.tz(
      `${dateStr} 12:${minutes.toString().padStart(2, '0')} AM`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else {
    // Standard 12-hour format
    shiftStart = dayjs.tz(
      `${dateStr} ${timeStr} ${period}`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  }
  
  return shiftStart
}

// Saqlain's test cases from your data
const saqlainCases = [
  { date: '2025-09-01', checkIn: '21:19', expected: 'Late' },
  { date: '2025-09-02', checkIn: '21:17', expected: 'Late' }, 
  { date: '2025-09-03', checkIn: '21:13', expected: 'On Time' }
]

// Saqlain's shift: 21:00 PM (9:00 PM)
const shiftStart = "21:00"
const shiftPeriod = "PM"

console.log('🧪 SAQLAIN ATTENDANCE TEST CASES')
console.log('=' .repeat(50))
console.log(`Shift Start: ${shiftStart} ${shiftPeriod}`)
console.log(`Grace Period: ${LATE_THRESHOLD_MINUTES} minutes`)
console.log('=' .repeat(50))

saqlainCases.forEach((testCase, index) => {
  const { date, checkIn, expected } = testCase
  
  console.log(`\nTest ${index + 1}: ${date}`)
  console.log(`Check-in: ${checkIn}`)
  
  // Parse shift start time
  const shiftStartTime = parseShiftTime(date, shiftStart, shiftPeriod, DEVICE_TZ)
  
  // Parse check-in time  
  const checkInTime = dayjs.tz(`${date} ${checkIn}:00`, 'YYYY-MM-DD HH:mm:ss', DEVICE_TZ)
  
  // Calculate grace period end
  const lateThreshold = shiftStartTime.add(LATE_THRESHOLD_MINUTES, 'minute')
  
  // Determine if late or on time
  const actualStatus = checkInTime.isAfter(lateThreshold) ? 'Late' : 'On Time'
  
  // Calculate minutes difference
  const minutesDiff = checkInTime.diff(lateThreshold, 'minute')
  
  console.log(`Shift Start: ${shiftStartTime.format('HH:mm')}`)
  console.log(`Grace Period Ends: ${lateThreshold.format('HH:mm')}`)
  console.log(`Check-in: ${checkInTime.format('HH:mm')}`)
  console.log(`Minutes ${actualStatus === 'Late' ? 'Late' : 'Early'}: ${Math.abs(minutesDiff)}`)
  console.log(`Status: ${actualStatus === 'Late' ? '🔴' : '🟢'} ${actualStatus}`)
  console.log(`Expected: ${expected} | Actual: ${actualStatus} | ${expected === actualStatus ? '✅ PASS' : '❌ FAIL'}`)
})

console.log('\n' + '=' .repeat(50))
console.log('📊 MONTHLY SUMMARY SIMULATION:')
console.log('📊 Employee 2 (Saqlain): Late=2, OnTime=1, Total=3 days, LateRate=66.7%')
console.log('=' .repeat(50))

// Explanation
console.log('\n💡 LOGIC EXPLANATION:')
console.log('• Shift starts at 21:00 (9:00 PM)')
console.log('• Grace period ends at 21:15 (9:15 PM)')
console.log('• Check-in at 21:13 (9:13 PM) = ON TIME (2 minutes early)')
console.log('• Check-in at 21:17 (9:17 PM) = LATE (2 minutes late)')
console.log('• Check-in at 21:19 (9:19 PM) = LATE (4 minutes late)')
console.log('\n✅ Only employees with assigned shifts will appear in monthly console output!')