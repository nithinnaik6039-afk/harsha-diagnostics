import mongoose from 'mongoose';

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

export default mongoose.model('Partner', PartnerSchema);
