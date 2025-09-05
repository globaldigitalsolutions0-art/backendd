import dayjs from 'dayjs'
// import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
import Event from '../models/Event.js'
import Employee from '../models/Employee.js'
import Shift from '../models/Shift.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)

// Constants
const DEVICE_TZ = process.env.DEVICE_TZ ?? 'Asia/Karachi'
const PASS_TYPES = ['FacePass', 'CardPass', 'FpPass', 'ValidOpenDoor', 'AccessGranted']
const NIGHT_SHIFT_START = process.env.NIGHT_SHIFT_START ?? '21:00'
const NIGHT_SHIFT_END = process.env.NIGHT_SHIFT_END ?? '06:00'
const NIGHT_CUTOFF_HOUR = Number(process.env.NIGHT_CUTOFF_HOUR ?? 2)
const LATE_THRESHOLD_MINUTES = 15

// Helper functions
const parseShiftTime = (dateStr, timeStr, period, timezone) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  let shiftStart
  
  // Handle different time formats
  if (hours > 12) {
    // 24-hour format (e.g., "21:00" with "PM") - this is wrong, should just use 24h format directly
    // Convert 21:00 to proper 24-hour format, ignore the PM
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

const getShiftWindowPKT = dateStr => {
  const startPKT = dayjs.tz(`${dateStr} ${NIGHT_SHIFT_START}`, 'YYYY-MM-DD HH:mm', DEVICE_TZ)
  const [endHour, endMin] = NIGHT_SHIFT_END.split(':').map(Number)
  const endPKT = startPKT.add(1, 'day').set('hour', endHour).set('minute', endMin)
  return { startUtc: startPKT.toDate(), endUtc: endPKT.toDate() }
}

const computeAttendance = async dateStr => {
  const { startUtc, endUtc } = getShiftWindowPKT(dateStr)
  const startPKT = dayjs.tz(`${dateStr} ${NIGHT_SHIFT_START}`, 'YYYY-MM-DD HH:mm', DEVICE_TZ)
  const endPKT = startPKT.add(1, 'day').set('hour', 7).set('minute', 0)
  const intimeEndPKT = startPKT.set('hour', 23).set('minute', 59)
  const outtimeStartPKT = startPKT.add(1, 'day').startOf('day')

  const rows = await Event.aggregate([
    {
      $match: {
        event_time: { $gte: startUtc, $lte: endPKT.toDate() },
        event_type: { $in: PASS_TYPES }
      }
    },
    {
      $group: {
        _id: '$employee_no',
        person_name: { $first: '$person_name' },
        card_no: { $first: '$card_no' },
        events: { $push: { event_time: '$event_time' } }
      }
    },
    {
      $project: {
        _id: 1,
        person_name: 1,
        card_no: 1,
        check_in: {
          $min: {
            $filter: {
              input: '$events',
              as: 'e',
              cond: {
                $and: [
                  { $gte: ['$$e.event_time', startPKT.toDate()] },
                  { $lte: ['$$e.event_time', intimeEndPKT.toDate()] }
                ]
              }
            }
          }
        },
        check_out: {
          $max: {
            $filter: {
              input: '$events',
              as: 'e',
              cond: {
                $and: [
                  { $gte: ['$$e.event_time', outtimeStartPKT.toDate()] },
                  { $lte: ['$$e.event_time', endPKT.toDate()] }
                ]
              }
            }
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ])

  const employees = await Employee.find({ employee_no: { $in: rows.map(r => r._id) } })
    .populate('shift_id')
    .lean()

  const employeeMap = Object.fromEntries(
    employees.map(emp => [emp.employee_no, { name: emp.name, shift: emp.shift_id }])
  )

  return rows.map(r => {
    const employee = employeeMap[r._id] ?? { name: r.person_name ?? null, shift: null }
    let late_status = 'No Shift Assigned'
    let check_in_time = null
    let total_minutes = null

    if (r.check_in?.event_time) {
      check_in_time = dayjs(r.check_in.event_time).tz(DEVICE_TZ)
      
      if (employee.shift) {
        const { start_time, start_period } = employee.shift
        
        // Validate shift data
        if (
          start_time &&
          start_period &&
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start_time) &&
          ['AM', 'PM'].includes(start_period)
        ) {
          try {
            // Use the helper function for better time parsing
            const shiftStart = parseShiftTime(dateStr, start_time, start_period, DEVICE_TZ)
            
            if (shiftStart.isValid()) {
              // Calculate 15-minute grace period
              // Example: Shift starts 21:00 (9:00 PM), grace period ends at 21:15 (9:15 PM)
              // - Check-in at 21:14 (9:14 PM) = On Time
              // - Check-in at 21:16 (9:16 PM) = Late
              const lateThreshold = shiftStart.add(LATE_THRESHOLD_MINUTES, 'minute')
              late_status = check_in_time.isAfter(lateThreshold) ? 'Late' : 'On Time'
            } else {
              late_status = 'Invalid Shift Data'
            }
          } catch (err) {
            late_status = 'Invalid Shift Data'
          }
        } else {
          late_status = 'Invalid Shift Data'
        }
      }
    }

    if (r.check_in?.event_time && r.check_out?.event_time) {
      total_minutes = Math.round((r.check_out.event_time - r.check_in.event_time) / 60000)
    }

    return {
      work_date: dateStr,
      employee_no: r._id,
      person_name: employee.name,
      card_no: r.card_no ?? null,
      check_in: check_in_time ? check_in_time.format('HH:mm') : null,
      check_out: r.check_out?.event_time
        ? dayjs(r.check_out.event_time).tz(DEVICE_TZ).format('HH:mm')
        : null,
      total_minutes,
      late_status
    }
  })
}

const computeAttendanceRange = async (startDate, endDate) => {
  const dates = []
  for (let d = dayjs(startDate); d.isBefore(endDate) || d.isSame(endDate); d = d.add(1, 'day')) {
    dates.push(d.format('YYYY-MM-DD'))
  }
  return (await Promise.all(dates.map(computeAttendance))).flat()
}

const fetchEvents = async (startDate, endDate) => {
  const start = dayjs.tz(startDate, DEVICE_TZ).startOf('day')
  const end = dayjs.tz(endDate, DEVICE_TZ).endOf('day')

  const events = await Event.find({
    event_time: { $gte: start.toDate(), $lte: end.toDate() },
    event_type: { $in: PASS_TYPES }
  }).lean()

  return events.map(e => {
    const eventTimePKT = dayjs(e.event_time).tz(DEVICE_TZ)
    let work_date = eventTimePKT.format('YYYY-MM-DD')
    if (eventTimePKT.hour() >= NIGHT_CUTOFF_HOUR) {
      work_date = eventTimePKT.subtract(1, 'day').format('YYYY-MM-DD')
    }
    return { ...e, event_time: eventTimePKT.format('YYYY-MM-DD HH:mm:ss'), work_date }
  })
}

// Controllers
export const getHealth = (_req, res) => res.json({ ok: true })

export const createEvents = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body]
    await Event.insertMany(payload, { ordered: false })
    res.json({ inserted: payload.length })
  } catch {
    res.status(500).json({ error: 'insert_failed' })
  }
}

export const getAttendance = async (req, res) => {
  const { startDate = '', endDate = '', date: singleDate = '' } = req.query
  const cleanDate = str => String(str).slice(0, 10)
  const sd = startDate && cleanDate(startDate)
  const ed = endDate && cleanDate(endDate)
  const d = singleDate && cleanDate(singleDate)

  const valid = /^\d{4}-\d{2}-\d{2}$/
  if ((d && !valid.test(d)) || (sd && !valid.test(sd)) || (ed && !valid.test(ed))) {
    return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' })
  }

  try {
    let data
    if (d) data = await computeAttendance(d)
    else if (sd && ed) data = await computeAttendanceRange(sd, ed)
    else {
      const [{ minDate, maxDate } = {}] = await Event.aggregate([
        { $group: { _id: null, minDate: { $min: '$event_time' }, maxDate: { $max: '$event_time' } } }
      ])
      data = minDate
        ? await computeAttendanceRange(dayjs(minDate).tz(DEVICE_TZ).format('YYYY-MM-DD'),
                                       dayjs(maxDate).tz(DEVICE_TZ).format('YYYY-MM-DD'))
        : []
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'fetch_failed' })
  }
}

export const getEvents = async (req, res) => {
  const { startDate = '', endDate = '', date: singleDate = '' } = req.query
  const cleanDate = str => String(str).slice(0, 10)
  const sd = startDate && cleanDate(startDate)
  const ed = endDate && cleanDate(endDate)
  const d = singleDate && cleanDate(singleDate)

  const valid = /^\d{4}-\d{2}-\d{2}$/
  if ((d && !valid.test(d)) || (sd && !valid.test(sd)) || (ed && !valid.test(ed))) {
    return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' })
  }

  try {
    let data
    if (d) data = await fetchEvents(d, d)
    else if (sd && ed) data = await fetchEvents(sd, ed)
    else {
      const [{ minDate, maxDate } = {}] = await Event.aggregate([
        { $group: { _id: null, minDate: { $min: '$event_time' }, maxDate: { $max: '$event_time' } } }
      ])
      data = minDate
        ? await fetchEvents(dayjs(minDate).tz(DEVICE_TZ).format('YYYY-MM-DD'),
                            dayjs(maxDate).tz(DEVICE_TZ).format('YYYY-MM-DD'))
        : []
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'fetch_failed' })
  }
}

export const getPresentEmployees = async (_req, res) => {
  try {
    const now = dayjs().tz(DEVICE_TZ)
    const hour = now.hour()
    const dateToUse = hour < 7 || (hour >= 7 && hour < 14)
      ? now.subtract(1, 'day').format('YYYY-MM-DD')
      : now.format('YYYY-MM-DD')

    const attendanceData = await computeAttendance(dateToUse)
    res.json(attendanceData.map(r => ({
      employee_no: r.employee_no,
      person_name: r.person_name,
      check_in: r.check_in,
      check_out: r.check_out,
      late_status: r.late_status
    })))
  } catch (err) {
    console.error('Error fetching present employees:', err)
    res.status(500).json({ error: 'fetch_failed' })
  }
}

export const getMonthlyAttendance = async (req, res) => {
  const { month } = req.query
  const now = dayjs().tz(DEVICE_TZ)
  const currentMonth = month || now.format('YYYY-MM')
  const valid = /^\d{4}-\d{2}$/
  if (!valid.test(currentMonth)) {
    return res.status(400).json({ error: 'Invalid month format, use YYYY-MM' })
  }

  try {
    const startDate = `${currentMonth}-01`
    const endDate = dayjs(startDate).tz(DEVICE_TZ).endOf('month').format('YYYY-MM-DD')
    const flatData = await computeAttendanceRange(startDate, endDate)

    // Collect unique sorted dates
    const dates = [...new Set(flatData.map(r => r.work_date))].sort()

    // Generate ALL dates in the month (including Sundays with no attendance)
    const allDatesInMonth = []
    const monthStart = dayjs(`${currentMonth}-01`).tz(DEVICE_TZ)
    const monthEnd = monthStart.endOf('month')
    
    for (let date = monthStart; date.isSameOrBefore(monthEnd); date = date.add(1, 'day')) {
      allDatesInMonth.push(date.format('YYYY-MM-DD'))
    }
    
    // Use all dates in month instead of just dates with attendance
    const completeDates = allDatesInMonth

    // Collect unique employees with names and shifts, sorted by employee_no
    const employeeMap = {}
    flatData.forEach(r => {
      // Only include employees who have shifts assigned and valid late_status
      if (r.late_status === 'Late' || r.late_status === 'On Time') {
        if (!employeeMap[r.employee_no]) {
          employeeMap[r.employee_no] = { 
            name: r.person_name || 'Unknown', 
            late_count: 0, 
            early_count: 0, 
            total_days: 0,
            saturday_count: 0,
            sunday_count: 0,
            daily_times: [] // Store daily check-in details
          }
        }
        employeeMap[r.employee_no].total_days += 1
        
        // Check if it's Saturday or Sunday
        const dayOfWeek = dayjs(r.work_date).day()
        if (dayOfWeek === 6) { // Saturday
          employeeMap[r.employee_no].saturday_count += 1
        } else if (dayOfWeek === 0) { // Sunday
          employeeMap[r.employee_no].sunday_count += 1
        }
        
        // Store daily check-in details
        employeeMap[r.employee_no].daily_times.push({
          date: r.work_date,
          check_in: r.check_in,
          check_out: r.check_out,
          status: r.late_status,
          total_minutes: r.total_minutes,
          day_of_week: dayOfWeek
        })
        
        if (r.late_status === 'Late') {
          employeeMap[r.employee_no].late_count += 1
        } else if (r.late_status === 'On Time') {
          employeeMap[r.employee_no].early_count += 1
        }
      }
    })

    const employees = Object.keys(employeeMap)
      .map(no => Number(no))
      .sort((a, b) => a - b)
      .map(no => {
        const emp = employeeMap[no]
        
        // Only show employees with shifts in console (Late/OnTime counts > 0 or total_days > 0)
        if (emp.total_days > 0) {
          console.log(`\n📊 Employee ${no} (${emp.name}): Late=${emp.late_count}, OnTime=${emp.early_count}, Saturday=${emp.saturday_count}, Sunday=${emp.sunday_count}, Total=${emp.total_days} days, LateRate=${emp.total_days > 0 ? ((emp.late_count / emp.total_days) * 100).toFixed(1) : '0.0'}%`)
          
          // Show detailed daily times with hours format
          emp.daily_times.sort((a, b) => a.date.localeCompare(b.date)).forEach(day => {
            const statusIcon = day.status === 'Late' ? '🔴' : '🟢'
            const workingHours = day.total_minutes ? `${Math.floor(day.total_minutes / 60)}h ${day.total_minutes % 60}m` : 'N/A'
            const dayName = day.day_of_week === 0 ? 'Sunday' : day.day_of_week === 6 ? 'Saturday' : ''
            const dayIndicator = dayName ? ` (${dayName})` : ''
            console.log(`   ${statusIcon} ${day.date}${dayIndicator}: In=${day.check_in || 'N/A'}, Out=${day.check_out || 'N/A'}, Hours=${workingHours}, Status=${day.status}`)
          })
        }
        
        return {
          employee_no: no,
          person_name: emp.name,
          late_count: emp.late_count,
          early_count: emp.early_count,
          total_days: emp.total_days,
          saturday_count: emp.saturday_count,
          sunday_count: emp.sunday_count,
          late_percentage: emp.total_days > 0 ? ((emp.late_count / emp.total_days) * 100).toFixed(1) : '0.0',
          daily_times: emp.daily_times
        }
      })

    // Pivot the data: attendance[work_date][employee_no] = { check_in, check_out, total_minutes, late_status }
    const attendance = {}
    flatData.forEach(r => {
      if (!attendance[r.work_date]) {
        attendance[r.work_date] = {}
      }
      attendance[r.work_date][r.employee_no] = {
        check_in: r.check_in,
        check_out: r.check_out,
        total_minutes: r.total_minutes,
        late_status: r.late_status
      }
    })

    res.json({ dates: completeDates, employees, attendance })
  } catch (err) {
    console.error('Error fetching monthly attendance:', err)
    res.status(500).json({ error: 'fetch_failed' })
  }
}