import mongoose from 'mongoose';

const AttendanceEventSchema = new mongoose.Schema({
  employee_no: String,
  card_no: String,
  person_name: String,
  event_type: String,
  event_time: { type: Date, index: true },
  door_no: Number,
  reader_no: Number,
  device_ip: String,
}, { timestamps: true });

const Event = mongoose.model("attendance_events", AttendanceEventSchema);

export default Event;