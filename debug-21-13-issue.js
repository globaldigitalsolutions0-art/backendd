// Debug the specific issue with 21:13 being marked as Late
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
  
  console.log(`\ud83d\udd0d Parsing shift time: ${timeStr} ${period}`)
  console.log(`   Hours: ${hours}, Minutes: ${minutes}`)
  
  if (hours > 12) {
    // 24-hour format (e.g., "21:00" with "PM")
    const convertedHours = hours - 12
    const convertedTime = `${convertedHours}:${minutes.toString().padStart(2, '0')}`
    console.log(`   Converting 24h to 12h: ${timeStr} → ${convertedTime} PM`)
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

console.log('🚨 DEBUGGING: Why 21:13 shows as LATE')
console.log('=' .repeat(50))

// Test the problematic case
const dateStr = '2025-09-03'
const checkInTimeStr = '21:13'
const shiftStart = '21:00'
const shiftPeriod = 'PM'

console.log(`Date: ${dateStr}`)
console.log(`Check-in: ${checkInTimeStr}`)
console.log(`Shift: ${shiftStart} ${shiftPeriod}`)

// Parse shift start time
const shiftStartTime = parseShiftTime(dateStr, shiftStart, shiftPeriod, DEVICE_TZ)
console.log(`\\n\ud83d\udcc5 Parsed shift start: ${shiftStartTime.format('YYYY-MM-DD HH:mm:ss')}`)

// Parse check-in time
const checkInTime = dayjs.tz(`${dateStr} ${checkInTimeStr}:00`, 'YYYY-MM-DD HH:mm:ss', DEVICE_TZ)
console.log(`\ud83d\udcc5 Check-in time: ${checkInTime.format('YYYY-MM-DD HH:mm:ss')}`)

// Calculate grace period
const lateThreshold = shiftStartTime.add(LATE_THRESHOLD_MINUTES, 'minute')
console.log(`\ud83d\udcc5 Late threshold (grace period end): ${lateThreshold.format('YYYY-MM-DD HH:mm:ss')}`)

// Check comparison
const isLate = checkInTime.isAfter(lateThreshold)
const minutesDiff = checkInTime.diff(lateThreshold, 'minute')

console.log(`\\n\ud83e\udd14 COMPARISON:`)
console.log(`   Check-in (${checkInTime.format('HH:mm')}) > Threshold (${lateThreshold.format('HH:mm')})? ${isLate}`)
console.log(`   Minutes difference: ${minutesDiff} (negative = early, positive = late)`)
console.log(`   Expected result: ON TIME (should be false for isLate)`)
console.log(`   Actual result: ${isLate ? 'LATE' : 'ON TIME'}`)

if (isLate && minutesDiff < 0) {
  console.log(`\\n\u274c ERROR FOUND: Check-in is BEFORE threshold but showing as LATE!`)
  console.log(`\u274c This suggests an issue with time zone handling or date parsing`)
} else if (!isLate && minutesDiff <= 0) {
  console.log(`\\n\u2705 CORRECT: Check-in is within grace period`)
} else {
  console.log(`\\n\u2753 UNEXPECTED: Need further investigation`)
}

console.log('\\n' + '=' .repeat(50))

// Let's also test the exact times to see what's happening
console.log('\ud83d\udd0d DETAILED TIME ANALYSIS:')
console.log(`Shift start timestamp: ${shiftStartTime.valueOf()}`)
console.log(`Check-in timestamp: ${checkInTime.valueOf()}`)
console.log(`Late threshold timestamp: ${lateThreshold.valueOf()}`)
console.log(`Difference in milliseconds: ${checkInTime.valueOf() - lateThreshold.valueOf()}`)
console.log(`Difference in minutes: ${(checkInTime.valueOf() - lateThreshold.valueOf()) / 60000}`)