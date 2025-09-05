// Test to verify the fix for shift time parsing
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const DEVICE_TZ = 'Asia/Karachi'
const LATE_THRESHOLD_MINUTES = 15

// Fixed parseShiftTime function
const parseShiftTime = (dateStr, timeStr, period, timezone) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  let shiftStart
  
  // Handle different time formats
  if (hours > 12) {
    // 24-hour format (e.g., "21:00" with "PM") - use 24h format directly
    shiftStart = dayjs.tz(
      `${dateStr} ${timeStr}`,
      'YYYY-MM-DD HH:mm',
      timezone
    )
  } else if (hours === 0) {
    // Midnight format ("00:xx")
    shiftStart = dayjs.tz(
      `${dateStr} 12:${minutes.toString().padStart(2, '0')} AM`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else if (hours === 12) {
    // Noon/Midnight handling
    shiftStart = dayjs.tz(
      `${dateStr} ${timeStr} ${period}`,
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

console.log('🔧 TESTING THE FIX FOR SHIFT TIME PARSING')
console.log('=' .repeat(50))

// Test the problematic case from Saqlain
const testCases = [
  { date: '2025-09-01', checkIn: '21:19', expected: 'Late' },
  { date: '2025-09-02', checkIn: '21:17', expected: 'Late' }, 
  { date: '2025-09-03', checkIn: '21:13', expected: 'On Time' } // This should be ON TIME!
]

const shiftStart = "21:00"
const shiftPeriod = "PM"

testCases.forEach((testCase, index) => {
  const { date, checkIn, expected } = testCase
  
  console.log(`\nTest ${index + 1}: ${date}`)
  console.log(`Check-in: ${checkIn}`)
  
  // Parse shift start time using FIXED function
  const shiftStartTime = parseShiftTime(date, shiftStart, shiftPeriod, DEVICE_TZ)
  
  // Parse check-in time  
  const checkInTime = dayjs.tz(`${date} ${checkIn}:00`, 'YYYY-MM-DD HH:mm:ss', DEVICE_TZ)
  
  // Calculate grace period end
  const lateThreshold = shiftStartTime.add(LATE_THRESHOLD_MINUTES, 'minute')
  
  // Determine if late or on time
  const actualStatus = checkInTime.isAfter(lateThreshold) ? 'Late' : 'On Time'
  
  // Calculate minutes difference
  const minutesDiff = checkInTime.diff(lateThreshold, 'minute')
  
  console.log(`   Shift Start: ${shiftStartTime.format('YYYY-MM-DD HH:mm:ss')} (${shiftStartTime.format('HH:mm')})`)
  console.log(`   Grace Period Ends: ${lateThreshold.format('YYYY-MM-DD HH:mm:ss')} (${lateThreshold.format('HH:mm')})`)
  console.log(`   Check-in: ${checkInTime.format('YYYY-MM-DD HH:mm:ss')} (${checkInTime.format('HH:mm')})`)
  console.log(`   Minutes ${actualStatus === 'Late' ? 'Late' : 'Early'}: ${Math.abs(minutesDiff)}`)
  console.log(`   Status: ${actualStatus === 'Late' ? '🔴' : '🟢'} ${actualStatus}`)
  console.log(`   Expected: ${expected} | Actual: ${actualStatus} | ${expected === actualStatus ? '✅ PASS' : '❌ FAIL'}`)
})

console.log('\n' + '=' .repeat(50))
console.log('📊 EXPECTED NEW RESULTS:')
console.log('📊 Employee 2 (Saqlain): Late=2, OnTime=1, Total=3 days, LateRate=66.7%')
console.log('   🔴 2025-09-01: In=21:19, Out=06:08, Hours=8h 48m, Status=Late')
console.log('   🔴 2025-09-02: In=21:17, Out=06:05, Hours=8h 49m, Status=Late')  
console.log('   🟢 2025-09-03: In=21:13, Out=N/A, Hours=N/A, Status=On Time')
console.log('=' .repeat(50))