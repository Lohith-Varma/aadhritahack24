const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema(
  {
    userId:                   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:                     { type: Date, required: true },
    sleepHours:               { type: Number, required: true, min: 0, max: 24 },
    lateNightScreenTimeMins:  { type: Number, required: true, min: 0 },
    phonePickups:             { type: Number, required: true, min: 0 },
    focusScore:               { type: Number, required: true, min: 1, max: 10 },
    mood:                     { type: Number, min: 1, max: 5, default: 3 },
    notes:                    { type: String, default: '' },
  },
  { timestamps: true }
);

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
