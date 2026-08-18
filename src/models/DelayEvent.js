import mongoose from 'mongoose';

const delayEventSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  triggeredBy: {
    type: String,
    enum: ['MLT', 'System'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const DelayEvent = mongoose.model('DelayEvent', delayEventSchema);
export default DelayEvent;
