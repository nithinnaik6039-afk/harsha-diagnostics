import mongoose from 'mongoose';
import { createSmartModel } from './smartModel.js';

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  isOnline: { type: Boolean, default: false },
  earnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

PartnerSchema.index({ location: '2dsphere' });

const PartnerMongoose = mongoose.models.Partner || mongoose.model('Partner', PartnerSchema);
const Partner = createSmartModel('Partner', PartnerMongoose, 'partners');

export default Partner;
