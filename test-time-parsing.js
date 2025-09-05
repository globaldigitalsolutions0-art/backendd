// Test script to verify the improved time parsing logic
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const DEVICE_TZ = 'Asia/Karachi'

// Helper function (same as in attendanceController.js)
const parseShiftTime = (dateStr, timeStr, period, timezone) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  let shiftStart
  
  console.log(`Parsing: ${timeStr} ${period} (Hours: ${hours}, Minutes: ${minutes})`)
  
  // Handle different time formats
  if (hours > 12) {
    // 24-hour format (e.g., "21:00" with "PM")
    const convertedHours = hours - 12
    const convertedTime = `${convertedHours}:${minutes.toString().padStart(2, '0')}`
    console.log(`  → Converting 24h format: ${timeStr} → ${convertedTime} PM`)
    shiftStart = dayjs.tz(
      `${dateStr} ${convertedTime} PM`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else if (hours === 0) {
    // Midnight format ("00:xx")
    console.log(`  → Converting midnight: ${timeStr} → 12:${minutes.toString().padStart(2, '0')} AM`)
    shiftStart = dayjs.tz(
      `${dateStr} 12:${minutes.toString().padStart(2, '0')} AM`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else if (hours === 12) {
    // Noon/Midnight handling
    console.log(`  → Standard 12-hour: ${timeStr} ${period}`)
    shiftStart = dayjs.tz(
      `${dateStr} ${timeStr} ${period}`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  } else {
    // Standard 12-hour format
    console.log(`  → Standard 12-hour: ${timeStr} ${period}`)
    shiftStart = dayjs.tz(
      `${dateStr} ${timeStr} ${period}`,
      'YYYY-MM-DD h:mm A',
      timezone
    )
  }
  
  return shiftStart
}

// Test cases
const testCases = [
  { time: "21:00", period: "PM", description: "Night shift (24h format with PM)" },
  { time: "09:00", period: "AM", description: "Morning shift" },
  { time: "14:30", period: "PM", description: "Afternoon shift (24h format)" },
  { time: "00:00", period: "AM", description: "Midnight shift" },
  { time: "12:00", period: "PM", description: "Noon shift" },
  { time: "12:00", period: "AM", description: "Midnight (12 AM)" }
]

console.log("🕐 TIME PARSING TEST")
console.log("=".repeat(50))

const testDate = "2025-09-01"

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.description}`)
  console.log(`Input: ${test.time} ${test.period}`)
  
  try {
    const result = parseShiftTime(testDate, test.time, test.period, DEVICE_TZ)
    console.log(`Result: ${result.format('YYYY-MM-DD HH:mm:ss')} (${result.isValid() ? '✅ Valid' : '❌ Invalid'})`)
    console.log(`Formatted: ${result.format('h:mm A')}`)
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
})

console.log("\n" + "=".repeat(50))
console.log("✅ Test completed!")

// Simulate the actual case from your error
console.log("\n🔍 SPECIFIC CASE SIMULATION:")
console.log("Employee 2 (Saqlain) - Shift: 21:00 PM")
const employeeShiftStart = parseShiftTime("2025-09-01", "21:00", "PM", DEVICE_TZ)
const checkInTime = dayjs.tz("2025-09-01 21:19:39", "YYYY-MM-DD HH:mm:ss", DEVICE_TZ)

console.log(`Shift Start: ${employeeShiftStart.format('YYYY-MM-DD HH:mm:ss')} (${employeeShiftStart.isValid() ? 'Valid' : 'Invalid'})`)
console.log(`Check-in: ${checkInTime.format('YYYY-MM-DD HH:mm:ss')}`)

if (employeeShiftStart.isValid()) {
  const lateThreshold = employeeShiftStart.add(15, 'minute')
  const isLate = checkInTime.isAfter(lateThreshold)
  const minutesDiff = checkInTime.diff(lateThreshold, 'minute')
  
  console.log(`Grace Period Ends: ${lateThreshold.format('HH:mm')}`)
  console.log(`Status: ${isLate ? '🔴 LATE' : '🟢 ON TIME'}`)
  console.log(`Minutes ${isLate ? 'Late' : 'Early'}: ${Math.abs(minutesDiff)}`)
}