// Demo showing the new detailed console output format
console.log('🎯 NEW DETAILED MONTHLY ATTENDANCE OUTPUT')
console.log('=' .repeat(60))

// Sample data based on Saqlain's case
const sampleOutput = `
📊 Employee 2 (Saqlain): Late=3, OnTime=0, Total=3 days, LateRate=100.0%
   🔴 2025-09-01: In=21:19, Out=06:08, Hours=8h 49m, Status=Late
   🔴 2025-09-02: In=21:17, Out=06:05, Hours=8h 48m, Status=Late
   🔴 2025-09-03: In=21:13, Out=N/A, Hours=N/A, Status=Late

📊 Employee 3 (Ahmed): Late=1, OnTime=2, Total=3 days, LateRate=33.3%
   🟢 2025-09-01: In=21:05, Out=06:15, Hours=9h 10m, Status=On Time
   🔴 2025-09-02: In=21:20, Out=06:00, Hours=8h 40m, Status=Late
   🟢 2025-09-03: In=21:10, Out=06:05, Hours=8h 55m, Status=On Time
`

console.log(sampleOutput)

console.log('=' .repeat(60))
console.log('📝 OUTPUT EXPLANATION:')
console.log('• 📊 = Employee summary line with counts and percentage')
console.log('• 🔴 = Late day (checked in after 15-minute grace period)')
console.log('• 🟢 = On time day (checked in within grace period)')
console.log('• In = Check-in time (24-hour format)')
console.log('• Out = Check-out time (24-hour format)')
console.log('• Hours = Total working hours for that day')
console.log('• Status = Late or On Time based on 15-minute grace period')
console.log('')
console.log('🕘 GRACE PERIOD LOGIC:')
console.log('• Shift starts: 21:00 (9:00 PM)')
console.log('• Grace period ends: 21:15 (9:15 PM)')
console.log('• Check-in ≤ 21:15 = On Time 🟢')
console.log('• Check-in > 21:15 = Late 🔴')
console.log('')
console.log('⚠️  NOTE: Only employees with assigned shifts will appear')
console.log('=' .repeat(60))