import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  start_time: {
    type: String,
    required: true
  },
  start_period: {
    type: String,
    required: true,
    enum: ['AM', 'PM']
  },
  end_time: {
    type: String,
    required: true
  },
  end_period: {
    type: String,
    required: true,
    enum: ['AM', 'PM']
  }
});

// No index or non-unique index (optional for performance)
// ShiftSchema.index({ start_time: 1, start_period: 1, end_time: 1, end_period: 1 });

const Shift = mongoose.model('Shift', ShiftSchema);

export default Shift;