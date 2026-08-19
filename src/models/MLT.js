import mongoose from 'mongoose';
import { createSmartModel } from './smartModel.js';

const mltSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  photoUrl: {
    type: String
  },
  certificateUrl: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [77.6006, 14.6819] } // [lng, lat]
  },
  liveLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  rating: {
    type: Number,
    default: 5.0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  email: {
    type: String,
    sparse: true
  },
  firebaseUid: {
    type: String,
    sparse: true
  },
  expoPushToken: { type: String, default: null }  // Expo push token for job alert notifications
}, {
  timestamps: true
});

const MLTMongoose = mongoose.models.MLT || mongoose.model('MLT', mltSchema);
const MLT = createSmartModel('MLT', MLTMongoose, 'mlts');

export default MLT;
