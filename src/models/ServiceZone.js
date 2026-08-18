import mongoose from 'mongoose';

const serviceZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  centerCoordinates: {
    lat: { type: Number, required: true, default: 14.6819 },
    lng: { type: Number, required: true, default: 77.6006 }
  },
  radiusKm: {
    type: Number,
    required: true,
    default: 5.0
  },
  freeRadiusKm: {
    type: Number,
    required: true,
    default: 3.0
  },
  extraChargeAmount: {
    type: Number,
    required: true,
    default: 20.0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ServiceZone = mongoose.model('ServiceZone', serviceZoneSchema);
export default ServiceZone;
