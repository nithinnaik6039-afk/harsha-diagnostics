import mongoose from 'mongoose';
import { createSmartModel } from './smartModel.js';

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

const DelayEventMongoose = mongoose.models.DelayEvent || mongoose.model('DelayEvent', delayEventSchema);
const DelayEvent = createSmartModel('DelayEvent', DelayEventMongoose, 'delayEvents');

export default DelayEvent;
