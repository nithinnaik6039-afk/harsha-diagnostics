import mongoose from 'mongoose';
import { createSmartModel } from './smartModel.js';

const CertificateSchema = new mongoose.Schema({
  mlt: { type: mongoose.Schema.Types.ObjectId, ref: 'MLT', required: true },
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now }
});

const CertificateMongoose = mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
const Certificate = createSmartModel('Certificate', CertificateMongoose, 'certificates');

export default Certificate;
